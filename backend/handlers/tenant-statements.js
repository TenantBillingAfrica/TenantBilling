const { QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('../lib/dynamo');
const { getClaims, requireRole } = require('../lib/auth');
const { setEvent, ok, badRequest, unauthorized, serverError } = require('../lib/response');
const { parseBody } = require('../lib/request');

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
