const { PutCommand, QueryCommand, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuid } = require('uuid');
const { docClient } = require('../lib/dynamo');
const { getClaims, requireRole } = require('../lib/auth');
const { initiateCollection } = require('../lib/payments');
const { ok, created, badRequest, serverError } = require('../lib/response');

const TABLE = process.env.PAYMENTS_TABLE;
const INVOICES_TABLE = process.env.INVOICES_TABLE;

exports.handler = async (event) => {
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
    console.error(err);
    return serverError(err.message);
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
  const body = JSON.parse(event.body || '{}');
  const { invoiceId, phone, amount, currency } = body;

  if (!invoiceId || !phone || !amount) {
    return badRequest('invoiceId, phone, and amount are required');
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
  const body = JSON.parse(event.body || '{}');
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

  // If completed, mark invoice as paid
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
  }

  return ok({ message: 'Callback processed', status: newStatus });
}
