const { PutCommand, QueryCommand, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID: uuid } = require('crypto');
const { docClient } = require('../lib/dynamo');
const { getClaims, requireRole } = require('../lib/auth');
const { initiateCollection } = require('../lib/payments');
const { setEvent, ok, created, badRequest, serverError } = require('../lib/response');
const { parseBody, validateFields, isValidPhone, isNonNegativeNumber, verifyWebhookSignature } = require('../lib/request');

const TABLE = process.env.PAYMENTS_TABLE;
const INVOICES_TABLE = process.env.INVOICES_TABLE;

exports.handler = async (event) => {
  setEvent(event);
  const method = event.requestContext.http.method;
  const path = event.rawPath;

  try {
    // POST /payments/callback — unauthenticated webhook
    if (method === 'POST' && path === '/payments/callback') {
      return await handleCallback(event);
    }

    // All other routes require auth
    const claims = getClaims(event);
    const denied = requireRole(claims, 'instance_admin');
    if (denied) return denied;

    const { instanceId } = claims;

    if (method === 'GET') {
      return await list(instanceId, event);
    }

    if (method === 'POST' && path === '/payments/initiate') {
      return await initiate(instanceId, event);
    }

    return badRequest('Unsupported route');
  } catch (err) {
    console.error('PaymentsHandler error:', err);
    return serverError('An unexpected error occurred');
  }
};

async function list(instanceId, event) {
  const invoiceId = event.queryStringParameters?.invoiceId;

  if (invoiceId) {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'Invoice',
      KeyConditionExpression: 'invoiceId = :iid',
      ExpressionAttributeValues: { ':iid': invoiceId },
      ScanIndexForward: false,
    }));
    return ok(result.Items || []);
  }

  const result = await docClient.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'instanceId = :iid',
    ExpressionAttributeValues: { ':iid': instanceId },
  }));
  return ok(result.Items || []);
}

async function initiate(instanceId, event) {
  const body = parseBody(event);
  if (!body) return badRequest('Invalid JSON in request body');

  const allowedFields = ['invoiceId', 'phone', 'amount', 'currency'];
  const invalid = validateFields(body, allowedFields);
  if (invalid.length > 0) return badRequest(`Unknown fields: ${invalid.join(', ')}`);

  const { invoiceId, phone, amount, currency } = body;

  if (!invoiceId || !phone || !amount) {
    return badRequest('invoiceId, phone, and amount are required');
  }

  if (!isValidPhone(phone)) {
    return badRequest('Invalid phone number format');
  }

  if (!isNonNegativeNumber(amount) || amount <= 0) {
    return badRequest('Amount must be a positive number');
  }

  const transactionId = uuid();

  // Save pending payment record
  const payment = {
    instanceId,
    id: uuid(),
    invoiceId,
    transactionId,
    phone,
    amount,
    currency: currency || 'UGX',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  await docClient.send(new PutCommand({ TableName: TABLE, Item: payment }));

  // Call ChatWorks/PawaPay
  const result = await initiateCollection({
    transactionId,
    phone,
    amount,
    currency: currency || 'UGX',
    description: `Invoice ${invoiceId}`,
  });

  // Update payment with gateway response
  await docClient.send(new UpdateCommand({
    TableName: TABLE,
    Key: { instanceId, id: payment.id },
    UpdateExpression: 'SET gatewayResponse = :gr, gatewayStatus = :gs',
    ExpressionAttributeValues: {
      ':gr': JSON.stringify(result.body),
      ':gs': String(result.statusCode),
    },
  }));

  return created({ payment, gatewayResponse: result });
}

async function handleCallback(event) {
  // Verify webhook signature
  const signature = event.headers?.['x-signature'] || event.headers?.['X-Signature'] || '';
  const rawBody = event.body || '';
  const apiToken = process.env.CHATWORKS_API_TOKEN;

  if (!verifyWebhookSignature(rawBody, signature, apiToken)) {
    console.error('Payment callback: invalid webhook signature');
    return badRequest('Invalid webhook signature');
  }

  const body = parseBody(event);
  if (!body) return badRequest('Invalid JSON in request body');

  const { depositId, status } = body;

  if (!depositId) return badRequest('depositId is required');

  // Find payment by transactionId
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE,
    IndexName: 'Transaction',
    KeyConditionExpression: 'transactionId = :tid',
    ExpressionAttributeValues: { ':tid': depositId },
  }));

  const payment = (result.Items || [])[0];
  if (!payment) return ok({ message: 'Payment not found, ignoring' });

  const newStatus = status === 'COMPLETED' ? 'completed' : 'failed';

  // Update payment status
  await docClient.send(new UpdateCommand({
    TableName: TABLE,
    Key: { instanceId: payment.instanceId, id: payment.id },
    UpdateExpression: 'SET #s = :s, completedAt = :at, callbackPayload = :cp',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: {
      ':s': newStatus,
      ':at': new Date().toISOString(),
      ':cp': JSON.stringify(body),
    },
  }));

  // If completed, mark invoice as paid and send receipt
  if (newStatus === 'completed') {
    await docClient.send(new UpdateCommand({
      TableName: INVOICES_TABLE,
      Key: { instanceId: payment.instanceId, id: payment.invoiceId },
      UpdateExpression: 'SET #s = :s, paidAt = :at, paymentId = :pid',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: {
        ':s': 'paid',
        ':at': new Date().toISOString(),
        ':pid': payment.id,
      },
    }));

    // Send payment receipt notification via WhatsApp (PDF) and Email (PDF)
    try {
      const { sendPaymentReceipt } = require('../lib/notifications');
      const TENANTS_TABLE = process.env.TENANTS_TABLE;
      const BUILDINGS_TABLE = process.env.BUILDINGS_TABLE;

      if (TENANTS_TABLE) {
        const invoiceResult = await docClient.send(new GetCommand({
          TableName: INVOICES_TABLE,
          Key: { instanceId: payment.instanceId, id: payment.invoiceId },
        }));
        const invoice = invoiceResult.Item;

        if (invoice) {
          // Get tenant details for email and building context
          let tenant = null;
          if (invoice.tenantId) {
            const tenantResult = await docClient.send(new QueryCommand({
              TableName: TENANTS_TABLE,
              KeyConditionExpression: 'instanceId = :iid AND id = :tid',
              ExpressionAttributeValues: {
                ':iid': payment.instanceId,
                ':tid': invoice.tenantId,
              },
            }));
            tenant = (tenantResult.Items || [])[0];
          }

          // Get building name
          let buildingName = '';
          if (tenant?.buildingId && BUILDINGS_TABLE) {
            const buildingResult = await docClient.send(new QueryCommand({
              TableName: BUILDINGS_TABLE,
              KeyConditionExpression: 'instanceId = :iid AND id = :bid',
              ExpressionAttributeValues: {
                ':iid': payment.instanceId,
                ':bid': tenant.buildingId,
              },
            }));
            const building = (buildingResult.Items || [])[0];
            buildingName = building?.name || '';
          }

          await sendPaymentReceipt({
            tenantName: tenant?.name || invoice.tenantName || 'Tenant',
            phone: payment.phone || tenant?.phone,
            email: tenant?.email,
            cc: invoice.ccEmail || null,
            amount: payment.amount,
            currency: payment.currency || 'KES',
            period: invoice.period,
            transactionId: payment.transactionId,
            paidAt: new Date().toISOString(),
            instanceName: 'Property Manager',
            unitNumber: tenant?.unitNumber,
            buildingName,
            invoiceId: payment.invoiceId,
          });
        }
      }
    } catch (receiptErr) {
      console.error('Failed to send payment receipt:', receiptErr);
    }
  }

  return ok({ message: 'Callback processed', status: newStatus });
}
