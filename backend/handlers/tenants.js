const { PutCommand, QueryCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuid } = require('uuid');
const { docClient } = require('../lib/dynamo');
const { getClaims, requireRole } = require('../lib/auth');
const { ok, created, badRequest, serverError } = require('../lib/response');

const TABLE = process.env.TENANTS_TABLE;

exports.handler = async (event) => {
  const method = event.requestContext.http.method;
  const claims = getClaims(event);
  const denied = requireRole(claims, 'instance_admin');
  if (denied) return denied;

  const { instanceId } = claims;

  try {
    switch (method) {
      case 'GET':
        return await list(instanceId, event);
      case 'POST':
        return await create(instanceId, event);
      case 'PUT':
        return await update(instanceId, event);
      case 'DELETE':
        return await remove(instanceId, event);
      default:
        return badRequest('Unsupported method');
    }
  } catch (err) {
    console.error(err);
    return serverError(err.message);
  }
};

async function list(instanceId, event) {
  const buildingId = event.queryStringParameters?.buildingId;

  if (buildingId) {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'Building',
      KeyConditionExpression: 'buildingId = :bid',
      ExpressionAttributeValues: { ':bid': buildingId },
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

async function create(instanceId, event) {
  const body = JSON.parse(event.body || '{}');
  const { name, email, phone, buildingId, unitNumber, rent, serviceCharge, meterNumber } = body;

  if (!name || !buildingId) return badRequest('Name and buildingId are required');

  const item = {
    instanceId,
    id: uuid(),
    name,
    email: email || '',
    phone: phone || '',
    buildingId,
    unitNumber: unitNumber || '',
    rent: rent || 0,
    serviceCharge: serviceCharge || 0,
    meterNumber: meterNumber || '',
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
  return created(item);
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

  return ok({ message: 'Tenant updated' });
}

async function remove(instanceId, event) {
  const id = event.pathParameters.id;
  await docClient.send(new DeleteCommand({ TableName: TABLE, Key: { instanceId, id } }));
  return ok({ message: 'Tenant deleted' });
}
