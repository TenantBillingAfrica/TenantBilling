const { PutCommand, QueryCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { AdminCreateUserCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { CognitoIdentityProviderClient } = require('@aws-sdk/client-cognito-identity-provider');
const { v4: uuid } = require('uuid');
const { docClient } = require('../lib/dynamo');
const { getClaims, requireRole } = require('../lib/auth');
const { ok, created, badRequest, serverError } = require('../lib/response');

const cognito = new CognitoIdentityProviderClient({});
const TABLE = process.env.STAFF_TABLE;

exports.handler = async (event) => {
  const method = event.requestContext.http.method;
  const claims = getClaims(event);
  const denied = requireRole(claims, 'instance_admin');
  if (denied) return denied;

  const { instanceId, instanceName } = claims;

  try {
    switch (method) {
      case 'GET':
        return await list(instanceId);
      case 'POST':
        return await create(instanceId, instanceName, event);
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

async function create(instanceId, instanceName, event) {
  const body = JSON.parse(event.body || '{}');
  const { name, email, phone, role } = body;

  if (!name || !email) return badRequest('Name and email are required');

  const staffRole = role || 'meter_reader';

  // Create Cognito user for the staff member
  await cognito.send(new AdminCreateUserCommand({
    UserPoolId: process.env.USER_POOL_ID,
    Username: email,
    TemporaryPassword: 'TempPass1!',
    UserAttributes: [
      { Name: 'email', Value: email },
      { Name: 'email_verified', Value: 'true' },
      { Name: 'custom:role', Value: staffRole },
      { Name: 'custom:instanceId', Value: instanceId },
      { Name: 'custom:instanceName', Value: instanceName || '' },
    ],
    DesiredDeliveryMediums: ['EMAIL'],
  }));

  const item = {
    instanceId,
    id: uuid(),
    name,
    email,
    phone: phone || '',
    role: staffRole,
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

  return ok({ message: 'Staff member updated' });
}

async function remove(instanceId, event) {
  const id = event.pathParameters.id;
  await docClient.send(new DeleteCommand({ TableName: TABLE, Key: { instanceId, id } }));
  return ok({ message: 'Staff member deleted' });
}
