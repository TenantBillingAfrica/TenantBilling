const { PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuid } = require('uuid');
const { docClient } = require('../lib/dynamo');
const { getClaims, requireRole } = require('../lib/auth');
const { ok, created, badRequest, serverError } = require('../lib/response');

const TABLE = process.env.METER_READINGS_TABLE;

exports.handler = async (event) => {
  const method = event.requestContext.http.method;
  const claims = getClaims(event);
  const denied = requireRole(claims, 'instance_admin', 'meter_reader');
  if (denied) return denied;

  const { instanceId } = claims;

  try {
    if (method === 'GET') {
      return await list(instanceId, event);
    }
    if (method === 'POST') {
      return await create(instanceId, claims, event);
    }
    return badRequest('Unsupported method');
  } catch (err) {
    console.error(err);
    return serverError(err.message);
  }
};

async function list(instanceId, event) {
  const tenantId = event.queryStringParameters?.tenantId;

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

  const result = await docClient.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'instanceId = :iid',
    ExpressionAttributeValues: { ':iid': instanceId },
  }));
  return ok(result.Items || []);
}

async function create(instanceId, claims, event) {
  const body = JSON.parse(event.body || '{}');
  const { tenantId, meterNumber, reading, notes } = body;

  if (!tenantId || reading === undefined) {
    return badRequest('tenantId and reading are required');
  }

  const item = {
    instanceId,
    id: uuid(),
    tenantId,
    meterNumber: meterNumber || '',
    reading: Number(reading),
    notes: notes || '',
    readBy: claims.email,
    createdAt: new Date().toISOString(),
  };

  await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
  return created(item);
}
