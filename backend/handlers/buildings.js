const { PutCommand, QueryCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuid } = require('uuid');
const { docClient } = require('../lib/dynamo');
const { getClaims, requireRole } = require('../lib/auth');
const { ok, created, badRequest, serverError } = require('../lib/response');

const TABLE = process.env.BUILDINGS_TABLE;

exports.handler = async (event) => {
  const method = event.requestContext.http.method;
  const claims = getClaims(event);
  const denied = requireRole(claims, 'instance_admin');
  if (denied) return denied;

  const { instanceId } = claims;

  try {
    switch (method) {
      case 'GET':
        return await list(instanceId);
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

async function list(instanceId) {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'instanceId = :iid',
    ExpressionAttributeValues: { ':iid': instanceId },
  }));
  return ok(result.Items || []);
}

async function create(instanceId, event) {
  const body = JSON.parse(event.body || '{}');
  const { name, address, units, paymentMethod } = body;

  if (!name) return badRequest('Building name is required');

  const item = {
    instanceId,
    id: uuid(),
    name,
    address: address || '',
    units: units || 0,
    paymentMethod: paymentMethod || 'mobile_money',
    createdAt: new Date().toISOString(),
    status: 'active',
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

  return ok({ message: 'Building updated' });
}

async function remove(instanceId, event) {
  const id = event.pathParameters.id;
  await docClient.send(new DeleteCommand({ TableName: TABLE, Key: { instanceId, id } }));
  return ok({ message: 'Building deleted' });
}
