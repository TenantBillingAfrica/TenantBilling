const { PutCommand, QueryCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { AdminCreateUserCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { CognitoIdentityProviderClient } = require('@aws-sdk/client-cognito-identity-provider');
const { randomUUID: uuid } = require('crypto');
const { docClient } = require('../lib/dynamo');
const { getClaims, requireRole } = require('../lib/auth');
const { setEvent, ok, created, badRequest, serverError } = require('../lib/response');
const { parseBody, validateFields, isValidEmail, generateTempPassword } = require('../lib/request');

const cognito = new CognitoIdentityProviderClient({});
const TABLE = process.env.STAFF_TABLE;

const ALLOWED_ROLES = ['meter_reader', 'instance_admin', 'accountant'];

exports.handler = async (event) => {
  setEvent(event);
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
    console.error('StaffHandler error:', err);
    return serverError('An unexpected error occurred');
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
  const body = parseBody(event);
  if (!body) return badRequest('Invalid JSON in request body');

  const allowedFields = ['name', 'email', 'phone', 'role'];
  const invalid = validateFields(body, allowedFields);
  if (invalid.length > 0) return badRequest(`Unknown fields: ${invalid.join(', ')}`);

  const { name, email, phone, role } = body;

  if (!name || !email) return badRequest('Name and email are required');

  if (!isValidEmail(email)) return badRequest('Invalid email format');

  const staffRole = role || 'meter_reader';
  if (!ALLOWED_ROLES.includes(staffRole)) {
    return badRequest(`Invalid role. Allowed: ${ALLOWED_ROLES.join(', ')}`);
  }

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

  // Create Cognito user for the staff member (skip if no USER_POOL_ID)
  if (process.env.USER_POOL_ID) {
    try {
      const tempPassword = generateTempPassword();
      await cognito.send(new AdminCreateUserCommand({
        UserPoolId: process.env.USER_POOL_ID,
        Username: email,
        TemporaryPassword: tempPassword,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'custom:role', Value: staffRole },
          { Name: 'custom:instanceId', Value: instanceId },
          { Name: 'custom:instanceName', Value: instanceName || '' },
        ],
        DesiredDeliveryMediums: ['EMAIL'],
      }));
    } catch (cognitoErr) {
      console.error('Failed to create Cognito user for staff:', cognitoErr.message);
    }
  }

  return created(item);
}

async function update(instanceId, event) {
  const id = event.pathParameters.id;
  const body = parseBody(event);
  if (!body) return badRequest('Invalid JSON in request body');

  const allowedFields = ['name', 'email', 'phone', 'role', 'status'];
  const invalid = validateFields(body, allowedFields);
  if (invalid.length > 0) return badRequest(`Unknown fields: ${invalid.join(', ')}`);

  if (body.role && !ALLOWED_ROLES.includes(body.role)) {
    return badRequest(`Invalid role. Allowed: ${ALLOWED_ROLES.join(', ')}`);
  }

  if (body.email && !isValidEmail(body.email)) {
    return badRequest('Invalid email format');
  }

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
