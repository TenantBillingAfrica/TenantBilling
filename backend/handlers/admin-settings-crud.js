const https = require('https');
const { GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('../lib/dynamo');
const { getClaims, requireRole } = require('../lib/auth');
const { setEvent, ok, badRequest, serverError } = require('../lib/response');

const SETTINGS_KEY = 'payment_gateway';
const CHATWORKS_ADMIN_PHONE = process.env.CHATWORKS_ADMIN_PHONE || '+254717124662';
const MASK = '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022';

const DEFAULTS = {
  pawapay: {
    apiToken: process.env.CHATWORKS_API_TOKEN || '',
    collectionsUrl: process.env.CHATWORKS_COLLECTIONS_URL || '',
    callbackUrl: process.env.CHATWORKS_CALLBACK_URL || '',
  },
  stripe: {
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    restrictedKey: process.env.STRIPE_RESTRICTED_KEY || '',
  },
};

/* ── helpers ──────────────────────────────────────────────── */

function maskValue(val) {
  if (!val) return '';
  return val.length <= 8 ? MASK : MASK + val.slice(-4);
}

function isMasked(val) {
  return typeof val === 'string' && val.startsWith(MASK);
}

function maskSettings(settings) {
  return {
    pawapay: {
      apiToken: maskValue(settings.pawapay?.apiToken),
      collectionsUrl: maskValue(settings.pawapay?.collectionsUrl),
      callbackUrl: maskValue(settings.pawapay?.callbackUrl),
    },
    stripe: {
      publishableKey: maskValue(settings.stripe?.publishableKey),
      restrictedKey: maskValue(settings.stripe?.restrictedKey),
    },
  };
}

function mergeField(incoming, current) {
  if (isMasked(incoming)) return current;        // field untouched – keep stored value
  if (incoming === undefined) return current;     // field absent   – keep stored value
  return incoming;                                // user provided a new value
}

function postJson(urlStr, data) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const payload = JSON.stringify(data);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.CHATWORKS_API_TOKEN}`,
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch (_) { resolve({ status: res.statusCode, data: { raw: body } }); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function loadMergedSettings() {
  const result = await docClient.send(new GetCommand({
    TableName: process.env.SETTINGS_TABLE,
    Key: { id: SETTINGS_KEY },
  }));
  const saved = result.Item || {};
  return {
    pawapay: { ...DEFAULTS.pawapay, ...saved.pawapay },
    stripe: { ...DEFAULTS.stripe, ...saved.stripe },
  };
}

/* ── handler ──────────────────────────────────────────────── */

exports.handler = async (event) => {
  setEvent(event);
  const claims = getClaims(event);
  const denied = requireRole(claims, 'system_admin', 'instance_admin');
  if (denied) return denied;

  const method = event.requestContext?.http?.method;
  const path = event.rawPath;

  try {
    if (method === 'GET' && path === '/admin/settings') {
      return await getSettings();
    }
    if (method === 'POST' && path === '/admin/settings/reveal') {
      return await revealSettings(event);
    }
    if (method === 'PUT' && path === '/admin/settings') {
      const body = JSON.parse(event.body || '{}');
      return await saveSettings(body, claims.email);
    }
    return badRequest('Unknown route');
  } catch (err) {
    console.error('AdminSettingsHandler error:', err);
    return serverError('An unexpected error occurred');
  }
};

/* ── GET  /admin/settings ── returns masked values ────────── */

async function getSettings() {
  const merged = await loadMergedSettings();
  return ok(maskSettings(merged));
}

/* ── POST /admin/settings/reveal ── OTP-gated unmasked read ─ */

async function revealSettings(event) {
  const body = JSON.parse(event.body || '{}');
  const { token, emailToken, code, phone } = body;

  if (!token || !code) return badRequest('Missing OTP token or code');

  if (phone !== CHATWORKS_ADMIN_PHONE) {
    return badRequest('OTP verification must target the authorised ChatWorks administrator');
  }

  // Verify via ChatWorks WhatsApp OTP
  const waRes = await postJson('https://www.chatworks.chat/api/auth/phone/verify', {
    token, code, phone, channel: 'whatsapp',
  });

  if (waRes.status !== 200) {
    // Fallback: email OTP
    if (emailToken) {
      const emailRes = await postJson('https://www.chatworks.chat/api/auth/email/verify', {
        token: emailToken, code,
      });
      if (emailRes.status !== 200) return badRequest('Invalid verification code');
    } else {
      return badRequest(waRes.data?.error || 'Invalid verification code');
    }
  }

  const merged = await loadMergedSettings();
  return ok(merged);
}

/* ── PUT  /admin/settings ── save (masked fields preserved) ─ */

async function saveSettings(body, updatedBy) {
  if (!body.pawapay && !body.stripe) return badRequest('No settings provided');

  const current = await loadMergedSettings();

  const inPawapay = body.pawapay || {};
  const inStripe = body.stripe || {};

  const item = {
    id: SETTINGS_KEY,
    pawapay: {
      apiToken: mergeField(inPawapay.apiToken, current.pawapay.apiToken),
      collectionsUrl: mergeField(inPawapay.collectionsUrl, current.pawapay.collectionsUrl),
      callbackUrl: mergeField(inPawapay.callbackUrl, current.pawapay.callbackUrl),
    },
    stripe: {
      publishableKey: mergeField(inStripe.publishableKey, current.stripe.publishableKey),
      restrictedKey: mergeField(inStripe.restrictedKey, current.stripe.restrictedKey),
    },
    updatedAt: new Date().toISOString(),
    updatedBy,
  };

  await docClient.send(new PutCommand({
    TableName: process.env.SETTINGS_TABLE,
    Item: item,
  }));

  // Return masked response — never leak values on save
  return ok(maskSettings(item));
}
