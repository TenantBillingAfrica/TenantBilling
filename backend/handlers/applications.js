const { PutCommand, GetCommand, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { AdminCreateUserCommand, AdminUpdateUserAttributesCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { CognitoIdentityProviderClient } = require('@aws-sdk/client-cognito-identity-provider');
const { randomUUID: uuid } = require('crypto');
const { docClient } = require('../lib/dynamo');
const { getClaims, requireRole } = require('../lib/auth');
const { setEvent, ok, created, badRequest, notFound, serverError } = require('../lib/response');
const { parseBody, validateFields, isValidEmail, generateTempPassword } = require('../lib/request');

const cognito = new CognitoIdentityProviderClient({});
const TABLE = process.env.APPLICATIONS_TABLE;
const USERS_TABLE = process.env.USERS_TABLE;
const BUILDINGS_TABLE = process.env.BUILDINGS_TABLE;

exports.handler = async (event) => {
  setEvent(event);
  const method = event.requestContext.http.method;
  const path = event.rawPath;

  try {
    // POST /applications — public registration
    if (method === 'POST' && path === '/applications') {
      return await createApplication(event);
    }

    // All remaining routes require auth
    const claims = getClaims(event);

    // GET /applications — system_admin list
    if (method === 'GET' && path === '/applications') {
      const denied = requireRole(claims, 'system_admin');
      if (denied) return denied;
      return await listApplications();
    }

    // PUT /applications/{id}/approve
    if (method === 'PUT' && path.endsWith('/approve')) {
      const denied = requireRole(claims, 'system_admin');
      if (denied) return denied;
      const id = event.pathParameters.id;
      return await approveApplication(id);
    }

    // PUT /applications/{id}/reject
    if (method === 'PUT' && path.endsWith('/reject')) {
      const denied = requireRole(claims, 'system_admin');
      if (denied) return denied;
      const id = event.pathParameters.id;
      return await rejectApplication(id);
    }

    // PUT /applications/{id}/suspend
    if (method === 'PUT' && path.endsWith('/suspend')) {
      const denied = requireRole(claims, 'system_admin');
      if (denied) return denied;
      const id = event.pathParameters.id;
      return await suspendApplication(id);
    }

    return badRequest('Unknown route');
  } catch (err) {
    console.error('ApplicationsHandler error:', err);
    return serverError('An unexpected error occurred');
  }
};

async function createApplication(event) {
  const body = parseBody(event);
  if (!body) return badRequest('Invalid JSON in request body');

  const allowedFields = ['name', 'email', 'phone', 'company', 'country', 'phoneVerified', 'emailVerified', 'verifiedAt'];
  const invalid = validateFields(body, allowedFields);
  if (invalid.length > 0) return badRequest(`Unknown fields: ${invalid.join(', ')}`);

  const { name, email, phone, company, country, phoneVerified, emailVerified, verifiedAt } = body;

  if (!name || !email || !company || !country) {
    return badRequest('Missing required fields: name, email, company, country');
  }

  if (!isValidEmail(email)) {
    return badRequest('Invalid email format');
  }

  const item = {
    id: uuid(),
    name,
    email,
    phone: phone || '',
    company,
    country,
    phoneVerified: !!phoneVerified,
    emailVerified: !!emailVerified,
    verifiedAt: verifiedAt || new Date().toISOString(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
  return created(item);
}

async function listApplications() {
  const result = await docClient.send(new ScanCommand({ TableName: TABLE, Limit: 1000 }));
  const items = (result.Items || []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return ok(items);
}

async function approveApplication(id) {
  const { Item } = await docClient.send(new GetCommand({ TableName: TABLE, Key: { id } }));
  if (!Item) return notFound('Application not found');

  const instanceId = `inst-${uuid().slice(0, 8)}`;
  const tempPassword = generateTempPassword();

  // Create Cognito user with random temp password (or update attributes if user exists)
  try {
    await cognito.send(new AdminCreateUserCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: Item.email,
      TemporaryPassword: tempPassword,
      UserAttributes: [
        { Name: 'email', Value: Item.email },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'custom:role', Value: 'instance_admin' },
        { Name: 'custom:instanceId', Value: instanceId },
        { Name: 'custom:instanceName', Value: Item.company },
      ],
      DesiredDeliveryMediums: ['EMAIL'],
    }));
  } catch (err) {
    if (err.name === 'UsernameExistsException') {
      // User account already exists in Cognito — update user attributes for instance admin access
      await cognito.send(new AdminUpdateUserAttributesCommand({
        UserPoolId: process.env.USER_POOL_ID,
        Username: Item.email,
        UserAttributes: [
          { Name: 'custom:role', Value: 'instance_admin' },
          { Name: 'custom:instanceId', Value: instanceId },
          { Name: 'custom:instanceName', Value: Item.company },
        ],
      }));
    } else {
      throw err;
    }
  }

  // Update application status
  await docClient.send(new UpdateCommand({
    TableName: TABLE,
    Key: { id },
    UpdateExpression: 'SET #s = :s, instanceId = :iid, approvedAt = :at',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: {
      ':s': 'approved',
      ':iid': instanceId,
      ':at': new Date().toISOString(),
    },
  }));

  return ok({ message: 'Application approved', instanceId });
}

async function rejectApplication(id) {
  const { Item } = await docClient.send(new GetCommand({ TableName: TABLE, Key: { id } }));
  if (!Item) return notFound('Application not found');

  await docClient.send(new UpdateCommand({
    TableName: TABLE,
    Key: { id },
    UpdateExpression: 'SET #s = :s, rejectedAt = :at',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: {
      ':s': 'rejected',
      ':at': new Date().toISOString(),
    },
  }));

  return ok({ message: 'Application rejected' });
}

async function suspendApplication(id) {
  const { Item } = await docClient.send(new GetCommand({ TableName: TABLE, Key: { id } }));
  if (!Item) return notFound('Application not found');

  await docClient.send(new UpdateCommand({
    TableName: TABLE,
    Key: { id },
    UpdateExpression: 'SET #s = :s, suspendedAt = :at',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: {
      ':s': 'suspended',
      ':at': new Date().toISOString(),
    },
  }));

  return ok({ message: 'Application suspended' });
}
