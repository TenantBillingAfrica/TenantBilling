const { PutCommand, QueryCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { CognitoIdentityProviderClient, AdminCreateUserCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { randomUUID: uuid } = require('crypto');
const { docClient } = require('../lib/dynamo');
const { getClaims, requireRole } = require('../lib/auth');
const { setEvent, ok, created, badRequest, serverError } = require('../lib/response');
const { parseBody, validateFields, isValidEmail, isValidPhone, isNonNegativeNumber, generateTempPassword } = require('../lib/request');

const cognito = new CognitoIdentityProviderClient({});
const TABLE = process.env.TENANTS_TABLE;

exports.handler = async (event) => {
  setEvent(event);
  const method = event.requestContext.http.method;
  const claims = getClaims(event);

  // Allow meter_reader read-only access to tenant list
  if (method === 'GET') {
    const denied = requireRole(claims, 'instance_admin', 'meter_reader');
    if (denied) return denied;
  } else {
    const denied = requireRole(claims, 'instance_admin');
    if (denied) return denied;
  }

  const { instanceId } = claims;

  try {
    switch (method) {
      case 'GET':
        return await list(instanceId, event);
      case 'POST':
        return await create(instanceId, claims, event);
      case 'PUT':
        return await update(instanceId, event);
      case 'DELETE':
        return await remove(instanceId, event);
      default:
        return badRequest('Unsupported method');
    }
  } catch (err) {
    console.error('TenantsHandler error:', err);
    return serverError('An unexpected error occurred');
  }
};

async function list(instanceId, event) {
  const buildingId = event.queryStringParameters?.buildingId;

  if (buildingId) {
    // Scope to instance: filter results by instanceId
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'Building',
      KeyConditionExpression: 'buildingId = :bid',
      FilterExpression: 'instanceId = :iid',
      ExpressionAttributeValues: {
        ':bid': buildingId,
        ':iid': instanceId,
      },
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
  const body = parseBody(event);
  if (!body) return badRequest('Invalid JSON in request body');

  const allowedFields = ['name', 'email', 'phone', 'buildingId', 'unitNumber', 'rent', 'serviceCharge', 'meterNumber', 'idNumber', 'kraPin', 'postalAddress', 'vacationNotice', 'leaseEndDate'];
  const invalid = validateFields(body, allowedFields);
  if (invalid.length > 0) return badRequest(`Unknown fields: ${invalid.join(', ')}`);

  const { name, email, phone, buildingId, unitNumber, rent, serviceCharge, meterNumber, idNumber, kraPin, postalAddress, vacationNotice, leaseEndDate } = body;

  if (!name || !buildingId) return badRequest('Name and buildingId are required');

  if (email && !isValidEmail(email)) return badRequest('Invalid email format');
  if (phone && !isValidPhone(phone)) return badRequest('Invalid phone number format');
  if (rent !== undefined && !isNonNegativeNumber(rent)) return badRequest('Rent must be a non-negative number');
  if (serviceCharge !== undefined && !isNonNegativeNumber(serviceCharge)) return badRequest('Service charge must be a non-negative number');

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
    idNumber: idNumber || '',
    kraPin: kraPin || '',
    postalAddress: postalAddress || '',
    vacationNotice: vacationNotice || '',
    leaseEndDate: leaseEndDate || '',
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));

  // Create Cognito user for tenant login (skip if no email)
  if (email && process.env.USER_POOL_ID) {
    try {
      const tempPassword = generateTempPassword();
      const userAttributes = [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'custom:role', Value: 'tenant' },
        { Name: 'custom:instanceId', Value: instanceId },
        { Name: 'custom:instanceName', Value: claims.instanceName || '' },
      ];
      if (phone) {
        userAttributes.push({ Name: 'phone_number', Value: phone });
      }
      await cognito.send(new AdminCreateUserCommand({
        UserPoolId: process.env.USER_POOL_ID,
        Username: email,
        TemporaryPassword: tempPassword,
        UserAttributes: userAttributes,
        DesiredDeliveryMediums: ['EMAIL'],
      }));
    } catch (cognitoErr) {
      // Log but don't fail tenant creation if Cognito fails
      console.error('Failed to create Cognito user for tenant:', cognitoErr.message);
    }
  }

  return created(item);
}

async function update(instanceId, event) {
  const id = event.pathParameters.id;
  const body = parseBody(event);
  if (!body) return badRequest('Invalid JSON in request body');

  const allowedFields = ['name', 'email', 'phone', 'buildingId', 'unitNumber', 'rent', 'serviceCharge', 'meterNumber', 'status', 'idNumber', 'kraPin', 'postalAddress', 'vacationNotice', 'leaseEndDate'];
  const invalid = validateFields(body, allowedFields);
  if (invalid.length > 0) return badRequest(`Unknown fields: ${invalid.join(', ')}`);

  if (body.email && !isValidEmail(body.email)) return badRequest('Invalid email format');
  if (body.phone && !isValidPhone(body.phone)) return badRequest('Invalid phone number format');
  if (body.rent !== undefined && !isNonNegativeNumber(body.rent)) return badRequest('Rent must be a non-negative number');
  if (body.serviceCharge !== undefined && !isNonNegativeNumber(body.serviceCharge)) return badRequest('Service charge must be a non-negative number');

  const validStatuses = ['active', 'vacated', 'suspended'];
  if (body.status && !validStatuses.includes(body.status)) {
    return badRequest(`Invalid status. Allowed: ${validStatuses.join(', ')}`);
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

  // When marking a tenant as vacated, record the vacated timestamp
  if (body.status === 'vacated') {
    values[':vacatedAt'] = new Date().toISOString();
    expressions.push('vacatedAt = :vacatedAt');
  }

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
