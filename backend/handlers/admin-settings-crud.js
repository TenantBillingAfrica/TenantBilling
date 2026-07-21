const { GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('../lib/dynamo');
const { getClaims, requireRole } = require('../lib/auth');
const { setEvent, ok, badRequest, serverError } = require('../lib/response');

const SETTINGS_KEY = 'payment_gateway';

const DEFAULTS = {
  pawapay: {
    apiToken: process.env.CHATWORKS_API_TOKEN || '',
    collectionsUrl: process.env.CHATWORKS_COLLECTIONS_URL || '',
    callbackUrl: process.env.CHATWORKS_CALLBACK_URL || '',
  },
  stripe: {
    publishableKey: '',
    secretKey: '',
  },
};

exports.handler = async (event) => {
  setEvent(event);
  const claims = getClaims(event);
  const denied = requireRole(claims, 'system_admin');
  if (denied) return denied;

  const method = event.requestContext?.http?.method;

  try {
    if (method === 'GET') {
      return await getSettings();
    }
    if (method === 'PUT') {
      const body = JSON.parse(event.body || '{}');
      return await saveSettings(body, claims.email);
    }
    return badRequest('Unknown method');
  } catch (err) {
    console.error('AdminSettingsHandler error:', err);
    return serverError('An unexpected error occurred');
  }
};

async function getSettings() {
  const result = await docClient.send(new GetCommand({
    TableName: process.env.SETTINGS_TABLE,
    Key: { id: SETTINGS_KEY },
  }));

  const saved = result.Item || {};
  const merged = {
    pawapay: { ...DEFAULTS.pawapay, ...saved.pawapay },
    stripe: { ...DEFAULTS.stripe, ...saved.stripe },
  };

  return ok(merged);
}

async function saveSettings(body, updatedBy) {
  if (!body.pawapay && !body.stripe) {
    return badRequest('No settings provided');
  }

  const item = {
    id: SETTINGS_KEY,
    pawapay: body.pawapay || DEFAULTS.pawapay,
    stripe: body.stripe || DEFAULTS.stripe,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };

  await docClient.send(new PutCommand({
    TableName: process.env.SETTINGS_TABLE,
    Item: item,
  }));

  return ok(item);
}
