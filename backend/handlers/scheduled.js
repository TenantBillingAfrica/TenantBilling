const { QueryCommand, ScanCommand, PutCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuid } = require('uuid');
const { docClient } = require('../lib/dynamo');
const {
  sendInvoiceNotification,
  sendPaymentReminder,
  sendMeterReadingReminder,
} = require('../lib/notifications');

const INVOICES_TABLE = process.env.INVOICES_TABLE;
const TENANTS_TABLE = process.env.TENANTS_TABLE;
const BUILDINGS_TABLE = process.env.BUILDINGS_TABLE;
const STAFF_TABLE = process.env.STAFF_TABLE;
const METER_READINGS_TABLE = process.env.METER_READINGS_TABLE;
const APPLICATIONS_TABLE = process.env.APPLICATIONS_TABLE;

/**
 * Scheduled billing handler.
 * Triggered by EventBridge rule on billing day (default: 1st of month).
 *
 * For each active instance:
 *   1. Generate invoices for all active tenants
 *   2. Send WhatsApp notifications with invoice details
 */
exports.generateAndSendInvoices = async (event) => {
  console.log('Scheduled invoice generation triggered', JSON.stringify(event));

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const period = `${year}-${String(month).padStart(2, '0')}`;
  const defaultWaterRate = 50;

  // Get all approved instances
  const appsResult = await docClient.send(new ScanCommand({
    TableName: APPLICATIONS_TABLE,
    FilterExpression: '#s = :status',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: { ':status': 'approved' },
  }));

  const instances = (appsResult.Items || []).filter(a => a.instanceId);
  console.log(`Processing ${instances.length} active instances`);

  let totalGenerated = 0;
  let totalSent = 0;

  for (const instance of instances) {
    const instanceId = instance.instanceId;
    const instanceName = instance.businessName || instance.name || 'Property Manager';

    try {
      // Get active tenants
      const tenantsResult = await docClient.send(new QueryCommand({
        TableName: TENANTS_TABLE,
        KeyConditionExpression: 'instanceId = :iid',
        ExpressionAttributeValues: { ':iid': instanceId },
      }));
      const tenants = (tenantsResult.Items || []).filter(t => t.status === 'active');

      if (tenants.length === 0) continue;

      // Check if invoices already generated for this period
      const existingInvoices = await docClient.send(new QueryCommand({
        TableName: INVOICES_TABLE,
        KeyConditionExpression: 'instanceId = :iid',
        FilterExpression: '#p = :period',
        ExpressionAttributeNames: { '#p': 'period' },
        ExpressionAttributeValues: {
          ':iid': instanceId,
          ':period': period,
        },
      }));

      if ((existingInvoices.Items || []).length > 0) {
        console.log(`Instance ${instanceId}: invoices already exist for ${period}, skipping generation`);
        continue;
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

      // Generate invoices
      for (const tenant of tenants) {
        let waterUsage = 0;
        let waterCharge = 0;

        if (tenant.meterNumber) {
          const readings = await docClient.send(new QueryCommand({
            TableName: METER_READINGS_TABLE,
            IndexName: 'Tenant',
            KeyConditionExpression: 'tenantId = :tid',
            ExpressionAttributeValues: { ':tid': tenant.id },
            ScanIndexForward: false,
            Limit: 2,
          }));

          const items = readings.Items || [];
          if (items.length >= 2) {
            waterUsage = items[0].reading - items[1].reading;
            waterCharge = waterUsage * defaultWaterRate;
          }
        }

        const totalAmount = (tenant.rent || 0) + (tenant.serviceCharge || 0) + waterCharge;

        const invoice = {
          instanceId,
          id: uuid(),
          tenantId: tenant.id,
          tenantName: tenant.name,
          buildingId: tenant.buildingId,
          period,
          rent: tenant.rent || 0,
          serviceCharge: tenant.serviceCharge || 0,
          waterUsage,
          waterCharge,
          totalAmount,
          status: 'unpaid',
          createdAt: now.toISOString(),
        };

        await docClient.send(new PutCommand({ TableName: INVOICES_TABLE, Item: invoice }));
        totalGenerated++;

        // Send notification if tenant has phone or email
        if (tenant.phone || tenant.email) {
          const notifResult = await sendInvoiceNotification({
            tenantName: tenant.name,
            phone: tenant.phone,
            email: tenant.email,
            period,
            rent: invoice.rent,
            serviceCharge: invoice.serviceCharge,
            waterUsage: invoice.waterUsage,
            waterCharge: invoice.waterCharge,
            totalAmount: invoice.totalAmount,
            currency: 'KES',
            instanceName,
            unitNumber: tenant.unitNumber,
            buildingName: buildingMap[tenant.buildingId] || '',
            invoiceId: invoice.id,
            createdAt: invoice.createdAt,
          });

          if (notifResult.sent) {
            totalSent++;
            const channels = [];
            if (notifResult.whatsapp?.sent) channels.push('whatsapp');
            if (notifResult.email?.sent) channels.push('email');
            await docClient.send(new UpdateCommand({
              TableName: INVOICES_TABLE,
              Key: { instanceId, id: invoice.id },
              UpdateExpression: 'SET notifiedAt = :at, notificationChannel = :ch',
              ExpressionAttributeValues: {
                ':at': now.toISOString(),
                ':ch': channels.join('+') || 'whatsapp',
              },
            }));
          }
        }
      }
    } catch (err) {
      console.error(`Error processing instance ${instanceId}:`, err);
    }
  }

  console.log(`Scheduled billing complete: ${totalGenerated} invoices generated, ${totalSent} notifications sent`);
  return { generated: totalGenerated, notified: totalSent };
};

/**
 * Scheduled payment reminder handler.
 * Triggered by EventBridge rule (e.g., every 3 days after billing day).
 * Sends reminders for invoices unpaid after 7+ days.
 */
exports.sendPaymentReminders = async (event) => {
  console.log('Scheduled payment reminders triggered', JSON.stringify(event));

  const now = new Date();
  const daysThreshold = 7;

  // Get all approved instances
  const appsResult = await docClient.send(new ScanCommand({
    TableName: APPLICATIONS_TABLE,
    FilterExpression: '#s = :status',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: { ':status': 'approved' },
  }));

  const instances = (appsResult.Items || []).filter(a => a.instanceId);
  let totalReminders = 0;

  for (const instance of instances) {
    const instanceId = instance.instanceId;

    try {
      // Get unpaid invoices
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

      const overdueInvoices = (invoicesResult.Items || []).filter(inv => {
        const daysSince = Math.floor((now - new Date(inv.createdAt)) / (1000 * 60 * 60 * 24));
        return daysSince >= daysThreshold;
      });

      if (overdueInvoices.length === 0) continue;

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

      for (const invoice of overdueInvoices) {
        const tenant = tenantMap[invoice.tenantId];
        if (!tenant || !tenant.phone) continue;

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
          totalReminders++;
          await docClient.send(new UpdateCommand({
            TableName: INVOICES_TABLE,
            Key: { instanceId, id: invoice.id },
            UpdateExpression: 'SET lastReminderAt = :at, reminderCount = if_not_exists(reminderCount, :zero) + :one',
            ExpressionAttributeValues: {
              ':at': now.toISOString(),
              ':zero': 0,
              ':one': 1,
            },
          }));
        }
      }
    } catch (err) {
      console.error(`Error processing reminders for instance ${instanceId}:`, err);
    }
  }

  console.log(`Payment reminders complete: ${totalReminders} reminders sent`);
  return { sent: totalReminders };
};

/**
 * Scheduled meter reading reminder handler.
 * Triggered by EventBridge rule (e.g., 25th of each month).
 * Reminds meter readers to submit readings before billing day.
 */
exports.sendMeterReadingReminders = async (event) => {
  console.log('Scheduled meter reading reminders triggered', JSON.stringify(event));

  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Get all approved instances
  const appsResult = await docClient.send(new ScanCommand({
    TableName: APPLICATIONS_TABLE,
    FilterExpression: '#s = :status',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: { ':status': 'approved' },
  }));

  const instances = (appsResult.Items || []).filter(a => a.instanceId);
  let totalReminders = 0;

  for (const instance of instances) {
    const instanceId = instance.instanceId;

    try {
      // Get tenants with meters
      const tenantsResult = await docClient.send(new QueryCommand({
        TableName: TENANTS_TABLE,
        KeyConditionExpression: 'instanceId = :iid',
        ExpressionAttributeValues: { ':iid': instanceId },
      }));
      const tenantsWithMeters = (tenantsResult.Items || []).filter(t => t.status === 'active' && t.meterNumber);

      if (tenantsWithMeters.length === 0) continue;

      // Get this month's readings
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
      if (unreadTenants.length === 0) continue;

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
      const unreadBuildingNames = [...new Set(unreadTenants.map(t => buildingMap[t.buildingId]).filter(Boolean))];

      // Get meter reader staff
      const staffResult = await docClient.send(new QueryCommand({
        TableName: STAFF_TABLE,
        KeyConditionExpression: 'instanceId = :iid',
        ExpressionAttributeValues: { ':iid': instanceId },
      }));
      const meterReaders = (staffResult.Items || []).filter(s => s.role === 'meter_reader' && s.status === 'active' && s.phone);

      for (const reader of meterReaders) {
        const result = await sendMeterReadingReminder({
          staffName: reader.name,
          phone: reader.phone,
          unreadCount: unreadTenants.length,
          buildingNames: unreadBuildingNames,
        });

        if (result.sent) totalReminders++;
      }
    } catch (err) {
      console.error(`Error processing meter reminders for instance ${instanceId}:`, err);
    }
  }

  console.log(`Meter reading reminders complete: ${totalReminders} reminders sent`);
  return { sent: totalReminders };
};
