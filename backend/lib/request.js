const crypto = require('crypto');

/**
 * Safely parse JSON body from an API Gateway event.
 * Returns the parsed object or null if parsing fails.
 */
function parseBody(event) {
  try {
    return JSON.parse(event.body || '{}');
  } catch (err) {
    return null;
  }
}

/**
 * Validate that an object only contains allowed fields.
 * Returns an array of invalid field names, or empty array if all valid.
 */
function validateFields(body, allowedFields) {
  const invalid = Object.keys(body).filter(key => !allowedFields.includes(key));
  return invalid;
}

/**
 * Validate email format.
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate phone format (international with +).
 */
function isValidPhone(phone) {
  return /^\+?[1-9]\d{6,14}$/.test(phone.replace(/[\s()-]/g, ''));
}

/**
 * Validate that a value is a non-negative number.
 */
function isNonNegativeNumber(val) {
  return typeof val === 'number' && isFinite(val) && val >= 0;
}

/**
 * Generate a random temporary password for new Cognito users.
 * Produces a 12-character base64 password with a forced symbol appended.
 */
function generateTempPassword() {
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowers = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%^&*';

  const pick = (chars) => chars[crypto.randomInt(chars.length)];

  const pass = [
    pick(uppers),
    pick(lowers),
    pick(digits),
    pick(symbols),
    pick(uppers),
    pick(lowers),
    pick(digits),
    pick(symbols),
    pick(uppers),
    pick(digits),
  ];

  for (let i = pass.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [pass[i], pass[j]] = [pass[j], pass[i]];
  }

  return pass.join('');
}

/**
 * Verify HMAC-SHA256 webhook signature.
 * Returns true if the signature is valid.
 */
function verifyWebhookSignature(payload, signature, secret) {
  if (!signature || !secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
}

module.exports = {
  parseBody,
  validateFields,
  isValidEmail,
  isValidPhone,
  isNonNegativeNumber,
  generateTempPassword,
  verifyWebhookSignature,
};
