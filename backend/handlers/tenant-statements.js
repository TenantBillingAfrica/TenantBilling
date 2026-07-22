const { QueryCommand, ScanCommand, PutCommand, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID: uuid } = require('crypto');
const { docClient } = require('../lib/dynamo');
const { getClaims, requireRole } = require('../lib/auth');
const { setEvent, ok, badRequest, unauthorized, serverError } = require('../lib/response');
const { parseBody } = require('../lib/request');
const { initiateCollection } = require('../lib/payments');

const TENANTS_TABLE = process.env.TENANTS_TABLE;
const INVOICES_TABLE = process.env.INVOICES_TABLE;
const PAYMENTS_TABLE = process.env.PAYMENTS_TABLE;
const BUILDINGS_TABLE = process.env.BUILDINGS_TABLE;

/**
 * Tenant self-service statements endpoint.
 *
 * Flow:
 *   1. POST /tenant-portal/request-otp — Send OTP to tenant's WhatsApp number
 *   2. POST /tenant-portal/verify-otp  — Verify OTP and return session token
 *   3. POST /tenant-portal/statement   — Fetch statement for date range (requires valid session)
 */
exports.handler = async (event) => {
  setEvent(event);
  const method = event.requestContext.http.method;
  const path = event.rawPath;

  try {
    if (method === 'GET' && path === '/tenant-portal/my-statement') {
      return await getMyStatement(event);
    }
    if (method === 'GET' && path === '/tenant-portal/pay-mpesa') {
      return await payMpesa(event);
    }
    if (method === 'POST' && path === '/tenant-portal/request-otp') {
      return await requestOtp(event);
    }
    if (method === 'POST' && path === '/tenant-portal/verify-otp') {
      return await verifyOtp(event);
    }
    if (method === 'POST' && path === '/tenant-portal/statement') {
      return await getStatement(event);
    }
    return badRequest('Unsupported route');
  } catch (err) {
    console.error('TenantStatementsHandler error:', err);
    return serverError('An unexpected error occurred');
  }
};

/**
 * JWT-authenticated endpoint: GET /tenant-portal/my-statement
 * Tenant logs in via Cognito, then fetches their own statement.
 */
async function getMyStatement(event) {
  const claims = getClaims(event);
  const denied = requireRole(claims, 'tenant');
  if (denied) return denied;

  const { startDate, endDate } = event.queryStringParameters || {};

  // Find tenant by email
  const tenantsResult = await docClient.send(new ScanCommand({
    TableName: TENANTS_TABLE,
    FilterExpression: 'email = :email',
    ExpressionAttributeValues: { ':email': claims.email },
    Limit: 10,
  }));

  const tenants = tenantsResult.Items || [];
  if (tenants.length === 0) return badRequest('No tenant record found for this account');

  const tenant = tenants[0];

  // Look up building name
  let buildingName = '';
  if (tenant.buildingId && tenant.instanceId) {
    try {
      const buildingResult = await docClient.send(new QueryCommand({
        TableName: BUILDINGS_TABLE,
        KeyConditionExpression: 'instanceId = :iid AND id = :bid',
        ExpressionAttributeValues: {
          ':iid': tenant.instanceId,
          ':bid': tenant.buildingId,
        },
      }));
      if (buildingResult.Items && buildingResult.Items.length > 0) {
        buildingName = buildingResult.Items[0].name || '';
      }
    } catch (err) {
      console.error('Failed to look up building:', err.message);
    }
  }

  // Get invoices for this tenant
  const invoicesResult = await docClient.send(new QueryCommand({
    TableName: INVOICES_TABLE,
    IndexName: 'Tenant',
    KeyConditionExpression: 'tenantId = :tid',
    ExpressionAttributeValues: { ':tid': tenant.id },
    ScanIndexForward: false,
  }));

  let invoices = invoicesResult.Items || [];

  // Filter by date range
  if (startDate) {
    invoices = invoices.filter(inv => inv.createdAt >= startDate);
  }
  if (endDate) {
    invoices = invoices.filter(inv => inv.createdAt <= endDate + 'T23:59:59.999Z');
  }

  // Constrain to tenancy period
  if (tenant.createdAt) {
    invoices = invoices.filter(inv => inv.createdAt >= tenant.createdAt);
  }
  if (tenant.vacatedAt) {
    invoices = invoices.filter(inv => inv.createdAt <= tenant.vacatedAt);
  }

  // Get payments
  const paymentsResult = await docClient.send(new QueryCommand({
    TableName: PAYMENTS_TABLE,
    KeyConditionExpression: 'instanceId = :iid',
    ExpressionAttributeValues: { ':iid': tenant.instanceId },
  }));

  const paymentMap = {};
  for (const p of (paymentsResult.Items || [])) {
    if (p.status === 'completed') {
      paymentMap[p.invoiceId] = p;
    }
  }

  // Build statement
  const statement = invoices.map(inv => ({
    period: inv.period,
    rent: inv.rent || 0,
    serviceCharge: inv.serviceCharge || 0,
    waterUsage: inv.waterUsage || 0,
    waterCharge: inv.waterCharge || 0,
    totalAmount: inv.totalAmount || 0,
    status: inv.status,
    createdAt: inv.createdAt,
    paidAt: inv.paidAt || null,
    payment: paymentMap[inv.id] ? {
      amount: paymentMap[inv.id].amount,
      date: paymentMap[inv.id].completedAt,
      transactionId: paymentMap[inv.id].transactionId,
    } : null,
  }));

  const totalBilled = statement.reduce((s, i) => s + i.totalAmount, 0);
  const totalPaid = statement.filter(i => i.status === 'paid').reduce((s, i) => s + i.totalAmount, 0);
  const balance = totalBilled - totalPaid;

  return ok({
    tenant: {
      name: tenant.name,
      unitNumber: tenant.unitNumber,
      buildingId: tenant.buildingId,
      buildingName,
      moveInDate: tenant.createdAt,
      vacatedAt: tenant.vacatedAt || null,
      status: tenant.status || 'active',
    },
    statement,
    summary: {
      totalBilled,
      totalPaid,
      balance,
      invoiceCount: statement.length,
    },
  });
}

/**
 * Step 1: Tenant requests OTP via their WhatsApp phone number.
 * We look up the tenant by phone, then send OTP via ChatWorks.
 */
async function requestOtp(event) {
  const body = parseBody(event);
  if (!body) return badRequest('Invalid JSON in request body');

  const { phone } = body;
  if (!phone) return badRequest('Phone number is required');

  // Find tenant by phone across all instances
  // (We scan because phone is not a partition key)
  const result = await docClient.send(new ScanCommand({
    TableName: TENANTS_TABLE,
    FilterExpression: 'phone = :phone AND #s = :status',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: {
      ':phone': phone,
      ':status': 'active',
    },
    Limit: 10,
  }));

  const tenants = result.Items || [];
  if (tenants.length === 0) {
    return badRequest('No active tenant found with this phone number');
  }

  // Send OTP via ChatWorks WhatsApp
  const https = require('https');
  const API_TOKEN = process.env.CHATWORKS_API_TOKEN;

  // Decompose phone for ChatWorks
  let countryCode = '+254';
  let localPhone = phone.replace(/\D/g, '');
  const knownCodes = ['+251', '+254', '+255', '+256', '+250'];
  if (phone.startsWith('+')) {
    const found = knownCodes.find(c => phone.startsWith(c));
    if (found) {
      countryCode = found;
      localPhone = phone.slice(found.length);
    }
  }

  const otpPayload = JSON.stringify({
    countryCode,
    localPhone,
    channel: 'whatsapp',
    service: 'tenantbilling',
  });

  const otpResult = await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'www.chatworks.chat',
      path: '/api/auth/phone/start',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(otpPayload),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve({ statusCode: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ statusCode: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.write(otpPayload);
    req.end();
  });

  if (otpResult.statusCode >= 200 && otpResult.statusCode < 300) {
    return ok({
      message: 'OTP sent to your WhatsApp',
      token: otpResult.body.token,
      tenantId: tenants[0].id,
      instanceId: tenants[0].instanceId,
    });
  }

  return badRequest('Failed to send OTP. Please try again.');
}

/**
 * Step 2: Verify OTP code and issue a session.
 */
async function verifyOtp(event) {
  const body = parseBody(event);
  if (!body) return badRequest('Invalid JSON in request body');

  const { token, code, phone } = body;
  if (!token || !code) return badRequest('Token and code are required');

  const https = require('https');
  const verifyPayload = JSON.stringify({ token, code, phone, channel: 'whatsapp' });

  const verifyResult = await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'www.chatworks.chat',
      path: '/api/auth/phone/verify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(verifyPayload),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve({ statusCode: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ statusCode: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.write(verifyPayload);
    req.end();
  });

  if (verifyResult.statusCode >= 200 && verifyResult.statusCode < 300) {
    // Generate a simple session token (signed with API token as HMAC)
    const crypto = require('crypto');
    const sessionData = JSON.stringify({ phone, verified: true, exp: Date.now() + (60 * 60 * 1000) }); // 1 hour
    const sessionToken = Buffer.from(sessionData).toString('base64') + '.' +
      crypto.createHmac('sha256', process.env.CHATWORKS_API_TOKEN).update(sessionData).digest('hex');

    return ok({ message: 'Verified successfully', sessionToken });
  }

  return unauthorized('Invalid verification code');
}

/**
 * Step 3: Fetch statement for a date range.
 * Requires valid session token from step 2.
 */
async function getStatement(event) {
  const body = parseBody(event);
  if (!body) return badRequest('Invalid JSON in request body');

  const { sessionToken, startDate, endDate } = body;
  if (!sessionToken) return unauthorized('Session token is required');

  // Verify session token
  const crypto = require('crypto');
  const parts = sessionToken.split('.');
  if (parts.length !== 2) return unauthorized('Invalid session token');

  const [dataB64, sig] = parts;
  let sessionData;
  try {
    sessionData = JSON.parse(Buffer.from(dataB64, 'base64').toString());
  } catch {
    return unauthorized('Invalid session token');
  }

  const expectedSig = crypto.createHmac('sha256', process.env.CHATWORKS_API_TOKEN).update(JSON.stringify(sessionData)).digest('hex');

  // Timing-safe comparison - but lengths may differ, so check length first
  if (sig.length !== expectedSig.length || !crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedSig, 'hex'))) {
    return unauthorized('Invalid session token');
  }

  if (Date.now() > sessionData.exp) {
    return unauthorized('Session expired. Please request a new OTP.');
  }

  const phone = sessionData.phone;
  if (!phone) return unauthorized('Invalid session');

  // Find tenant by phone
  const tenantsResult = await docClient.send(new ScanCommand({
    TableName: TENANTS_TABLE,
    FilterExpression: 'phone = :phone',
    ExpressionAttributeValues: { ':phone': phone },
    Limit: 10,
  }));

  const tenants = tenantsResult.Items || [];
  if (tenants.length === 0) return badRequest('Tenant not found');

  const tenant = tenants[0];
  const instanceId = tenant.instanceId;

  // Get invoices for date range
  const invoicesResult = await docClient.send(new QueryCommand({
    TableName: INVOICES_TABLE,
    IndexName: 'Tenant',
    KeyConditionExpression: 'tenantId = :tid',
    ExpressionAttributeValues: { ':tid': tenant.id },
    ScanIndexForward: false,
  }));

  let invoices = invoicesResult.Items || [];

  // Filter by date range
  if (startDate) {
    invoices = invoices.filter(inv => inv.createdAt >= startDate);
  }
  if (endDate) {
    invoices = invoices.filter(inv => inv.createdAt <= endDate + 'T23:59:59.999Z');
  }

  // Constrain to tenancy period
  if (tenant.createdAt) {
    invoices = invoices.filter(inv => inv.createdAt >= tenant.createdAt);
  }
  if (tenant.vacatedAt) {
    invoices = invoices.filter(inv => inv.createdAt <= tenant.vacatedAt);
  }

  // Get payments
  const paymentsResult = await docClient.send(new QueryCommand({
    TableName: PAYMENTS_TABLE,
    KeyConditionExpression: 'instanceId = :iid',
    ExpressionAttributeValues: { ':iid': instanceId },
  }));

  const paymentMap = {};
  for (const p of (paymentsResult.Items || [])) {
    if (p.status === 'completed') {
      paymentMap[p.invoiceId] = p;
    }
  }

  // Build statement
  const statement = invoices.map(inv => ({
    period: inv.period,
    rent: inv.rent || 0,
    serviceCharge: inv.serviceCharge || 0,
    waterUsage: inv.waterUsage || 0,
    waterCharge: inv.waterCharge || 0,
    totalAmount: inv.totalAmount || 0,
    status: inv.status,
    createdAt: inv.createdAt,
    paidAt: inv.paidAt || null,
    payment: paymentMap[inv.id] ? {
      amount: paymentMap[inv.id].amount,
      date: paymentMap[inv.id].completedAt,
      transactionId: paymentMap[inv.id].transactionId,
    } : null,
  }));

  const totalBilled = statement.reduce((s, i) => s + i.totalAmount, 0);
  const totalPaid = statement.filter(i => i.status === 'paid').reduce((s, i) => s + i.totalAmount, 0);
  const balance = totalBilled - totalPaid;

  return ok({
    tenant: {
      name: tenant.name,
      unitNumber: tenant.unitNumber,
      buildingId: tenant.buildingId,
      moveInDate: tenant.createdAt,
      vacatedAt: tenant.vacatedAt || null,
    },
    statement,
    summary: {
      totalBilled,
      totalPaid,
      balance,
      invoiceCount: statement.length,
    },
  });
}

/**
 * GET /tenant-portal/pay-mpesa?invoiceId=xxx
 * Unauthenticated — triggered from email payment link.
 * Looks up invoice → tenant → creates payment → initiates M-Pesa STK push.
 * Returns a simple HTML page confirming prompt was sent.
 */
async function payMpesa(event) {
  const invoiceId = event.queryStringParameters?.invoiceId;
  if (!invoiceId) {
    return htmlResponse(400, 'Missing Invoice', 'No invoice ID provided. Please use the link from your email.');
  }

  // We need to scan for the invoice since we only have the id (no instanceId from an unauthenticated request)
  let invoiceScan = await docClient.send(new ScanCommand({
    TableName: INVOICES_TABLE,
    FilterExpression: 'id = :id',
    ExpressionAttributeValues: { ':id': invoiceId },
  }));

  // Paginate if needed
  while (invoiceScan.Items.length === 0 && invoiceScan.LastEvaluatedKey) {
    invoiceScan = await docClient.send(new ScanCommand({
      TableName: INVOICES_TABLE,
      FilterExpression: 'id = :id',
      ExpressionAttributeValues: { ':id': invoiceId },
      ExclusiveStartKey: invoiceScan.LastEvaluatedKey,
    }));
  }

  const invoice = (invoiceScan.Items || [])[0];
  if (!invoice) {
    return htmlResponse(404, 'Invoice Not Found', 'This invoice could not be found. It may have been removed.');
  }

  if (invoice.status === 'paid') {
    return htmlResponse(200, 'Already Paid', `This invoice for KES ${(invoice.totalAmount || 0).toLocaleString()} has already been paid. Thank you!`);
  }

  // Support partial payment: use amount query param or remaining balance
  const remainingAmount = (invoice.totalAmount || 0) - (invoice.paidAmount || 0);
  const requestedAmount = event.queryStringParameters?.amount ? Number(event.queryStringParameters.amount) : null;
  const payAmount = requestedAmount && requestedAmount > 0 && requestedAmount <= remainingAmount
    ? requestedAmount
    : remainingAmount;

  // Get tenant for phone number
  const tenantResult = await docClient.send(new QueryCommand({
    TableName: TENANTS_TABLE,
    KeyConditionExpression: 'instanceId = :iid AND id = :tid',
    ExpressionAttributeValues: {
      ':iid': invoice.instanceId,
      ':tid': invoice.tenantId,
    },
  }));

  const tenant = (tenantResult.Items || [])[0];
  if (!tenant || !tenant.phone) {
    return htmlResponse(400, 'Payment Error', 'Could not find tenant phone number for M-Pesa payment.');
  }

  // Check if there's already a pending payment for this invoice
  const existingPayments = await docClient.send(new QueryCommand({
    TableName: PAYMENTS_TABLE,
    IndexName: 'Invoice',
    KeyConditionExpression: 'invoiceId = :iid',
    ExpressionAttributeValues: { ':iid': invoiceId },
  }));

  const pendingPayment = (existingPayments.Items || []).find(p => p.status === 'pending');
  if (pendingPayment) {
    return htmlResponse(200, 'Payment Prompt Sent',
      `An M-Pesa payment prompt for KES ${(pendingPayment.amount || 0).toLocaleString()} has already been sent to ${maskPhone(tenant.phone)}. Please check your phone and enter your M-Pesa PIN to complete payment.`);
  }

  // Create payment record
  const transactionId = uuid();
  const payment = {
    instanceId: invoice.instanceId,
    id: uuid(),
    invoiceId,
    transactionId,
    phone: tenant.phone,
    amount: payAmount,
    currency: 'KES',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  await docClient.send(new PutCommand({ TableName: PAYMENTS_TABLE, Item: payment }));

  // Initiate M-Pesa STK push
  try {
    const result = await initiateCollection({
      transactionId,
      phone: tenant.phone,
      amount: payAmount,
      currency: 'KES',
      correspondent: 'MPESA_KEN',
      description: `Invoice ${invoice.period || invoiceId}`,
    });

    // Update payment with gateway response
    await docClient.send(new UpdateCommand({
      TableName: PAYMENTS_TABLE,
      Key: { instanceId: invoice.instanceId, id: payment.id },
      UpdateExpression: 'SET gatewayResponse = :gr, gatewayStatus = :gs',
      ExpressionAttributeValues: {
        ':gr': JSON.stringify(result.body),
        ':gs': String(result.statusCode),
      },
    }));

    const partialNote = payAmount < (invoice.totalAmount || 0)
      ? `<br><br>Remaining balance: <strong>KES ${(remainingAmount - payAmount).toLocaleString()}</strong>`
      : '';
    return htmlResponse(200, 'M-Pesa Payment Prompt Sent',
      `A payment prompt for <strong>KES ${payAmount.toLocaleString()}</strong> has been sent to <strong>${maskPhone(tenant.phone)}</strong>.<br><br>Please check your phone and enter your M-Pesa PIN to complete the payment.${partialNote}<br><br>You will receive an email receipt once payment is confirmed.`);
  } catch (err) {
    console.error('M-Pesa initiation failed:', err);
    return htmlResponse(500, 'Payment Error', 'Failed to send M-Pesa payment prompt. Please try again or contact your property manager.');
  }
}

function maskPhone(phone) {
  if (!phone || phone.length < 6) return phone;
  return phone.slice(0, 4) + '****' + phone.slice(-3);
}

function htmlResponse(statusCode, title, message) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - TenantBilling</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f0ff; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { background: white; border-radius: 20px; padding: 40px; max-width: 480px; width: 100%; box-shadow: 0 4px 24px rgba(108, 63, 197, 0.1); text-align: center; }
    .logo { height: 40px; margin-bottom: 24px; }
    h1 { color: #1a0a3e; font-size: 22px; margin-bottom: 16px; }
    p { color: #4a5568; font-size: 15px; line-height: 1.6; }
    .badge { display: inline-block; margin-top: 20px; padding: 8px 20px; border-radius: 999px; font-size: 13px; font-weight: 600; }
    .badge-success { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
    .badge-error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
    .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="card">
    <img src="https://tenantbilling-assets-382334305159.s3.eu-north-1.amazonaws.com/images/logo.png" alt="TenantBilling" class="logo">
    <h1>${title}</h1>
    <p>${message}</p>
    <span class="badge ${statusCode === 200 ? 'badge-success' : 'badge-error'}">${statusCode === 200 ? 'Processing' : 'Error'}</span>
    <div class="footer">Powered by TenantBilling &middot; tenantbilling.africa</div>
  </div>
</body>
</html>`;

  return {
    statusCode,
    headers: { 'Content-Type': 'text/html' },
    body: html,
  };
}
