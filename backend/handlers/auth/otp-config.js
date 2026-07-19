const { setEvent, ok, badRequest } = require('../../lib/response');

/**
 * OTP configuration endpoint.
 * Returns the phone number and delivery email for the given user.
 * This moves sensitive admin phone/email mappings to the server side.
 *
 * GET /auth/otp-config?email=<email>
 */

// Admin phone map — previously hardcoded in frontend
const ADMIN_PHONE_MAP = {
  'inashuriye@gmail.com': '+254722265670',
  'administrator@tenantbilling.africa': '+254717124662',
};

// Map login emails to working email addresses for OTP delivery
const ADMIN_OTP_EMAIL_MAP = {
  'administrator@tenantbilling.africa': 'amo.gombe@gmail.com',
};

exports.handler = async (event) => {
  setEvent(event);

  const email = event.queryStringParameters?.email;
  if (!email) {
    return badRequest('email query parameter is required');
  }

  const phone = ADMIN_PHONE_MAP[email] || null;
  const deliveryEmail = ADMIN_OTP_EMAIL_MAP[email] || email;

  return ok({ phone, deliveryEmail });
};
