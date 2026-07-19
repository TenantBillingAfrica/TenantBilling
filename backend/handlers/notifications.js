const { QueryCommand, UpdateCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('../lib/dynamo');
const { getClaims, requireRole } = require('../lib/auth');
const { setEvent, ok, badRequest, serverError } = require('../lib/response');
const { parseBody } = require('../lib/request');
const {
  sendInvoiceNotification,
  sendPaymentReminder,
  sendMeterReadingReminder,
} = require('../lib/notifications');

const INVOICES_TABLE = process.env.INVOICES_TABLE;
const TENANTS_TABLE = process.env.TENANTS_TABLE;
const STAFF_TABLE = process.env.STAFF_TABLE;
const METER_READINGS_TABLE = process.env.METER_READINGS_TABLE;
const BUILDINGS_TABLE = process.env.BUILDINGS_TABLE;

exports.handler = async (event) => {
  setEvent(event);
  const method = event.requestContext.http.method;
  const path = event.rawPath;
  const claims = getClaims(event);
  const denied = requireRole(claims, 'instance_admin');
  if (denied) return denied;

  const { instanceId } = claims;

  try {
    if (method === 'POST' && path === '/notifications/send-invoices') {
      return await sendInvoices(instanceId, event);
    }
    if (method === 'POST' && path === '/notifications/send-reminders') {
      return await sendReminders(instanceId, event);
    }
    if (method === 'POST' && path === '/notifications/send-meter-reminders') {
      return await sendMeterReminders(instanceId, event);
    }
    return badRequest('Unsupported route');
  } catch (err) {
    console.error('NotificationsHandler error:', err);
    return serverError('An unexpected error occurred');
  }
};

/**
 * Send invoice notifications via WhatsApp (PDF) and Email (PDF) to all tenants
 * with unpaid invoices for a given period (or all unpaid if no period specified).
 */
async function sendInvoices(instanceId, event) {
  const body = parseBody(event);
  const period = body?.period; // optional: filter by billing period

  // Get unpaid invoices for this instance
  const invoicesResult = await docClient.send(new QueryCommand({
    TableName: INVOICES_TABLE,
    KeyConditionExpression: 'instanceId = :iid',
    FilterExpression: '#s = :status',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: {
      ':iid': instanceId,
      ':status': 'unpaid',
    },
  }));

  let invoices = invoicesResult.Items || [];
  if (period) {
    invoices = invoices.filter(inv => inv.period === period);
  }

  if (invoices.length === 0) {
    return ok({ message: 'No unpaid invoices to send', sent: 0, failed: 0 });
  }

  // Get all tenants to look up phone numbers and emails
  const tenantsResult = await docClient.send(new QueryCommand({
    TableName: TENANTS_TABLE,
    KeyConditionExpression: 'instanceId = :iid',
    ExpressionAttributeValues: { ':iid': instanceId },
  }));
  const tenantMap = {};
  for (const t of (tenantsResult.Items || [])) {
    tenantMap[t.id] = t;
  }

  // Get buildings for building name lookup
  const buildingsResult = await docClient.send(new QueryCommand({
    TableName: BUILDINGS_TABLE,
    KeyConditionExpression: 'instanceId = :iid',
    ExpressionAttributeValues: { ':iid': instanceId },
  }));
  const buildingMap = {};
  for (const b of (buildingsResult.Items || [])) {
    buildingMap[b.id] = b.name;
  }

  // Get instance name from claims
  const claims = getClaims(event);
  const instanceName = claims.instanceName || 'Property Manager';

  let sent = 0;
  let failed = 0;
  const results = [];

  for (const invoice of invoices) {
    const tenant = tenantMap[invoice.tenantId];
    if (!tenant || (!tenant.phone && !tenant.email)) {
      failed++;
      results.push({ tenantId: invoice.tenantId, tenantName: invoice.tenantName, sent: false, reason: 'No phone or email' });
      continue;
    }

    const result = await sendInvoiceNotification({
      tenantName: tenant.name,
      phone: tenant.phone,
      email: tenant.email,
      period: invoice.period,
      rent: invoice.rent || 0,
      serviceCharge: invoice.serviceCharge || 0,
      waterUsage: invoice.waterUsage || 0,
      waterCharge: invoice.waterCharge || 0,
      totalAmount: invoice.totalAmount || 0,
      currency: 'KES',
      instanceName,
      unitNumber: tenant.unitNumber,
      buildingName: buildingMap[tenant.buildingId] || '',
      invoiceId: invoice.id,
      createdAt: invoice.createdAt,
    });

    if (result.sent) {
      sent++;
      // Mark invoice as notified
      const channels = [];
      if (result.whatsapp?.sent) channels.push('whatsapp');
      if (result.email?.sent) channels.push('email');
      await docClient.send(new UpdateCommand({
        TableName: INVOICES_TABLE,
        Key: { instanceId, id: invoice.id },
        UpdateExpression: 'SET notifiedAt = :at, notificationChannel = :ch',
        ExpressionAttributeValues: {
          ':at': new Date().toISOString(),
          ':ch': channels.join('+') || 'whatsapp',
        },
      }));
    } else {
      failed++;
    }
    results.push({ tenantId: invoice.tenantId, tenantName: invoice.tenantName, sent: result.sent });
  }

  return ok({ message: `Invoices sent: ${sent}, failed: ${failed}`, sent, failed, results });
}

/**
 * Send payment reminders to tenants with overdue invoices.
 */
async function sendReminders(instanceId, event) {
  const body = parseBody(event);
  const daysThreshold = body?.daysOverdue || 7; // Default: remind after 7 days

  // Get all unpaid invoices
  const invoicesResult = await docClient.send(new QueryCommand({
    TableName: INVOICES_TABLE,
    KeyConditionExpression: 'instanceId = :iid',
    FilterExpression: '#s = :status',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: {
      ':iid': instanceId,
      ':status': 'unpaid',
    },
  }));

  const now = new Date();
  const invoices = (invoicesResult.Items || []).filter(inv => {
    const createdAt = new Date(inv.createdAt);
    const daysSince = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
    return daysSince >= daysThreshold;
  });

  if (invoices.length === 0) {
    return ok({ message: 'No overdue invoices to remind', sent: 0, failed: 0 });
  }

  // Get tenants
  const tenantsResult = await docClient.send(new QueryCommand({
    TableName: TENANTS_TABLE,
    KeyConditionExpression: 'instanceId = :iid',
    ExpressionAttributeValues: { ':iid': instanceId },
  }));
  const tenantMap = {};
  for (const t of (tenantsResult.Items || [])) {
    tenantMap[t.id] = t;
  }

  let sent = 0;
  let failed = 0;

  for (const invoice of invoices) {
    const tenant = tenantMap[invoice.tenantId];
    if (!tenant || !tenant.phone) {
      failed++;
      continue;
    }

    const daysOverdue = Math.floor((now - new Date(invoice.createdAt)) / (1000 * 60 * 60 * 24));

    const result = await sendPaymentReminder({
      tenantName: tenant.name,
      phone: tenant.phone,
      period: invoice.period,
      totalAmount: invoice.totalAmount || 0,
      currency: 'KES',
      daysOverdue,
    });

    if (result.sent) {
      sent++;
      await docClient.send(new UpdateCommand({
        TableName: INVOICES_TABLE,
        Key: { instanceId, id: invoice.id },
        UpdateExpression: 'SET lastReminderAt = :at, reminderCount = if_not_exists(reminderCount, :zero) + :one',
        ExpressionAttributeValues: {
          ':at': new Date().toISOString(),
          ':zero': 0,
          ':one': 1,
        },
      }));
    } else {
      failed++;
    }
  }

  return ok({ message: `Reminders sent: ${sent}, failed: ${failed}`, sent, failed, totalOverdue: invoices.length });
}

/**
 * Send meter reading reminders to staff members for unread meters.
 */
async function sendMeterReminders(instanceId, event) {
  // Get active tenants with meters
  const tenantsResult = await docClient.send(new QueryCommand({
    TableName: TENANTS_TABLE,
    KeyConditionExpression: 'instanceId = :iid',
    ExpressionAttributeValues: { ':iid': instanceId },
  }));
  const tenantsWithMeters = (tenantsResult.Items || []).filter(t => t.status === 'active' && t.meterNumber);

  if (tenantsWithMeters.length === 0) {
    return ok({ message: 'No meters to read', sent: 0 });
  }

  // Get this month's readings to find which tenants haven't been read
  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const readingsResult = await docClient.send(new QueryCommand({
    TableName: METER_READINGS_TABLE,
    KeyConditionExpression: 'instanceId = :iid',
    ExpressionAttributeValues: { ':iid': instanceId },
  }));

  const thisMonthReadings = new Set();
  for (const reading of (readingsResult.Items || [])) {
    if (reading.createdAt?.startsWith(currentPeriod)) {
      thisMonthReadings.add(reading.tenantId);
    }
  }

  const unreadTenants = tenantsWithMeters.filter(t => !thisMonthReadings.has(t.id));
  if (unreadTenants.length === 0) {
    return ok({ message: 'All meters have been read this period', sent: 0 });
  }

  // Get buildings for context
  const buildingsResult = await docClient.send(new QueryCommand({
    TableName: BUILDINGS_TABLE,
    KeyConditionExpression: 'instanceId = :iid',
    ExpressionAttributeValues: { ':iid': instanceId },
  }));
  const buildingMap = {};
  for (const b of (buildingsResult.Items || [])) {
    buildingMap[b.id] = b.name;
  }

  // Get unread building names
  const unreadBuildingIds = [...new Set(unreadTenants.map(t => t.buildingId))];
  const unreadBuildingNames = unreadBuildingIds.map(id => buildingMap[id]).filter(Boolean);

  // Get meter reader staff
  const staffResult = await docClient.send(new QueryCommand({
    TableName: STAFF_TABLE,
    KeyConditionExpression: 'instanceId = :iid',
    ExpressionAttributeValues: { ':iid': instanceId },
  }));
  const meterReaders = (staffResult.Items || []).filter(s => s.role === 'meter_reader' && s.status === 'active' && s.phone);

  if (meterReaders.length === 0) {
    return ok({ message: 'No meter reader staff with phone numbers found', sent: 0, unreadCount: unreadTenants.length });
  }

  let sent = 0;
  let failed = 0;

  for (const reader of meterReaders) {
    const result = await sendMeterReadingReminder({
      staffName: reader.name,
      phone: reader.phone,
      unreadCount: unreadTenants.length,
      buildingNames: unreadBuildingNames,
    });

    if (result.sent) {
      sent++;
    } else {
      failed++;
    }
  }

  return ok({
    message: `Meter reading reminders sent to ${sent} staff member(s)`,
    sent,
    failed,
    unreadMeters: unreadTenants.length,
    totalMeters: tenantsWithMeters.length,
  });
}
