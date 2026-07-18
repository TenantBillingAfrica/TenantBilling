const { PutCommand, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuid } = require('uuid');
const { docClient } = require('../lib/dynamo');
const { getClaims, requireRole } = require('../lib/auth');
const { ok, created, badRequest, serverError } = require('../lib/response');

const TABLE = process.env.INVOICES_TABLE;
const TENANTS_TABLE = process.env.TENANTS_TABLE;
const METER_READINGS_TABLE = process.env.METER_READINGS_TABLE;

exports.handler = async (event) => {
  const method = event.requestContext.http.method;
  const path = event.rawPath;
  const claims = getClaims(event);
  const denied = requireRole(claims, 'instance_admin');
  if (denied) return denied;

  const { instanceId } = claims;

  try {
    if (method === 'GET') {
      return await list(instanceId, event);
    }
    if (method === 'POST' && path === '/invoices/generate') {
      return await generateBatch(instanceId, event);
    }
    if (method === 'PUT') {
      return await update(instanceId, event);
    }
    return badRequest('Unsupported route');
  } catch (err) {
    console.error(err);
    return serverError(err.message);
  }
};

async function list(instanceId, event) {
  const tenantId = event.queryStringParameters?.tenantId;
  const status = event.queryStringParameters?.status;

  if (tenantId) {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'Tenant',
      KeyConditionExpression: 'tenantId = :tid',
      ExpressionAttributeValues: { ':tid': tenantId },
      ScanIndexForward: false,
    }));
    return ok(result.Items || []);
  }

  if (status) {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'Status',
      KeyConditionExpression: '#s = :s',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':s': status },
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

async function generateBatch(instanceId, event) {
  const body = JSON.parse(event.body || '{}');
  const { month, year, waterRate } = body;

  if (!month || !year) return badRequest('Month and year are required');

  // Get all tenants for this instance
  const tenantsResult = await docClient.send(new QueryCommand({
    TableName: TENANTS_TABLE,
    KeyConditionExpression: 'instanceId = :iid',
    ExpressionAttributeValues: { ':iid': instanceId },
  }));

  const tenants = (tenantsResult.Items || []).filter(t => t.status === 'active');
  const invoices = [];
  const period = `${year}-${String(month).padStart(2, '0')}`;

  for (const tenant of tenants) {
    // Get latest meter reading for water calculation
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
        waterCharge = waterUsage * (waterRate || 50);
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
      createdAt: new Date().toISOString(),
    };

    await docClient.send(new PutCommand({ TableName: TABLE, Item: invoice }));
    invoices.push(invoice);
  }

  return created({ message: `Generated ${invoices.length} invoices`, invoices });
}

async function update(instanceId, event) {
  const id = event.pathParameters.id;
  const body = JSON.parse(event.body || '{}');

  const expressions = [];
  const names = {};
  const values = {};

  for (const [key, val] of Object.entries(body)) {
    if (['instanceId', 'id'].includes(key)) continue;
    const attr = `#${key}`;
    const valKey = `:${key}`;
    expressions.push(`${attr} = ${valKey}`);
    names[attr] = key;
    values[valKey] = val;
  }

  if (expressions.length === 0) return badRequest('No fields to update');

  values[':updatedAt'] = new Date().toISOString();
  expressions.push('updatedAt = :updatedAt');

  await docClient.send(new UpdateCommand({
    TableName: TABLE,
    Key: { instanceId, id },
    UpdateExpression: `SET ${expressions.join(', ')}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
  }));

  return ok({ message: 'Invoice updated' });
}
