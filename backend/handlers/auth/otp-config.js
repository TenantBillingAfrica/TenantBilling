const https = require('https');
const { setEvent, ok, badRequest, serverError } = require('../../lib/response');
const { parseBody } = require('../../lib/request');

const ADMIN_PHONE_MAP = {
  'inashuriye@gmail.com': '+254722265670',
  'administrator@tenantbilling.africa': '+254717124662',
};

const ADMIN_OTP_EMAIL_MAP = {
  'administrator@tenantbilling.africa': 'amo.gombe@gmail.com',
};

function decomposePhone(fullPhone) {
  let phoneToUse = fullPhone || '';
  let countryCode = '+254';
  let localPhone = phoneToUse.replace(/\D/g, '');

  if (phoneToUse.startsWith('+')) {
    const knownCodes = ['+251', '+254', '+255', '+256', '+250'];
    const foundCode = knownCodes.find((c) => phoneToUse.startsWith(c));
    if (foundCode) {
      countryCode = foundCode;
      localPhone = phoneToUse.slice(foundCode.length);
    }
  } else if (localPhone.startsWith('254')) {
    countryCode = '+254';
    localPhone = localPhone.slice(3);
  } else if (localPhone.startsWith('256')) {
    countryCode = '+256';
    localPhone = localPhone.slice(3);
  } else if (localPhone.startsWith('250')) {
    countryCode = '+250';
    localPhone = localPhone.slice(3);
  }

  return { countryCode, localPhone };
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
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (_) {
          resolve({ status: res.statusCode, data: { raw: body } });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

exports.handler = async (event) => {
  setEvent(event);
  const method = event.requestContext?.http?.method || event.httpMethod;
  const path = event.rawPath || event.path;

  try {
    if (method === 'GET' && path === '/auth/otp-config') {
      const email = event.queryStringParameters?.email;
      if (!email) return badRequest('email query parameter is required');
      const phone = ADMIN_PHONE_MAP[email] || null;
      const deliveryEmail = ADMIN_OTP_EMAIL_MAP[email] || email;
      return ok({ phone, deliveryEmail });
    }

    if (method === 'POST' && path === '/auth/send-otp') {
      return await sendOtp(event);
    }

    if (method === 'POST' && path === '/auth/verify-otp') {
      return await verifyOtp(event);
    }

    return badRequest('Unknown route');
  } catch (err) {
    console.error('OtpConfigHandler error:', err && (err.stack || err.message || err));
    return serverError(err.message || 'Failed to process request');
  }
};

async function sendOtp(event) {
  const body = parseBody(event);
  if (!body) return badRequest('Invalid JSON body');

  const { phone: inputPhone, email: inputEmail } = body;
  const phoneToUse = ADMIN_PHONE_MAP[inputEmail] || inputPhone;
  const deliveryEmail = ADMIN_OTP_EMAIL_MAP[inputEmail] || inputEmail;

  if (!phoneToUse) {
    return badRequest('Unable to resolve phone number for OTP delivery');
  }

  const { countryCode, localPhone } = decomposePhone(phoneToUse);

  // Send WhatsApp OTP
  const waRes = await postJson('https://www.chatworks.chat/api/auth/phone/start', {
    countryCode,
    localPhone,
    email: deliveryEmail,
    channel: 'whatsapp',
    service: 'chatworks',
  });

  if (waRes.status !== 200) {
    return badRequest(waRes.data?.error || 'Failed to send WhatsApp OTP');
  }

  // Send Email OTP (best effort)
  let emailToken = null;
  try {
    const emailRes = await postJson('https://www.chatworks.chat/api/auth/email/start', {
      email: deliveryEmail,
      service: 'chatworks',
    });
    if (emailRes.status === 200) {
      emailToken = emailRes.data?.token;
    }
  } catch (_) {}

  return ok({
    ...waRes.data,
    emailToken,
  });
}

async function verifyOtp(event) {
  const body = parseBody(event);
  if (!body) return badRequest('Invalid JSON body');

  const { token, emailToken, code, phone } = body;

  if (!token || !code) {
    return badRequest('Missing token or code');
  }

  // 1. Try WhatsApp token
  const waRes = await postJson('https://www.chatworks.chat/api/auth/phone/verify', {
    token,
    code,
    phone,
    channel: 'whatsapp',
  });

  if (waRes.status === 200) {
    return ok(waRes.data);
  }

  // 2. Fallback to Email token
  if (emailToken) {
    const emailRes = await postJson('https://www.chatworks.chat/api/auth/email/verify', {
      token: emailToken,
      code,
    });
    if (emailRes.status === 200) {
      return ok(emailRes.data);
    }
  }

  return badRequest(waRes.data?.error || 'Invalid verification code');
}
