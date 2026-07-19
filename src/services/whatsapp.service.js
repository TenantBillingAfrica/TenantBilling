/**
 * Service for sending and verifying OTPs via ChatWorks API (WhatsApp + Email)
 *
 * Admin phone numbers and email mappings are resolved server-side.
 * The frontend only passes the authenticated user's email; the backend
 * returns the appropriate phone/email for OTP delivery.
 */

import config from '../config';

/**
 * Decompose a full phone number into countryCode and localPhone.
 */
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

/**
 * Fetch OTP routing config from the backend for the given email.
 * Returns { phone, deliveryEmail } or falls back to provided values.
 */
async function fetchOtpConfig(email) {
  try {
    const token = localStorage.getItem('tb_id_token');
    const resp = await fetch(`${config.apiUrl}/auth/otp-config?email=${encodeURIComponent(email)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (resp.ok) {
      return await resp.json();
    }
  } catch (_) {
    // Fall through to use provided phone/email directly
  }
  return null;
}

export async function sendWhatsAppOtp(fullPhone, email) {
  // Try to resolve phone/email from backend config
  const otpConfig = await fetchOtpConfig(email);
  let phoneToUse = fullPhone;
  let deliveryEmail = email;

  if (otpConfig) {
    if (otpConfig.phone) phoneToUse = otpConfig.phone;
    if (otpConfig.deliveryEmail) deliveryEmail = otpConfig.deliveryEmail;
  }

  if (!phoneToUse || phoneToUse.includes('*')) {
    // If no phone available and no backend config, fail gracefully
    if (!otpConfig?.phone) {
      throw new Error('Unable to resolve phone number for OTP delivery. Please contact support.');
    }
    phoneToUse = otpConfig.phone;
  }

  const { countryCode, localPhone } = decomposePhone(phoneToUse);

  // Send OTP via WhatsApp channel
  const response = await fetch('https://www.chatworks.chat/api/auth/phone/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      countryCode,
      localPhone,
      email: deliveryEmail,
      channel: 'whatsapp',
      service: 'chatworks',
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to send WhatsApp OTP');
  }

  // Also send OTP via Email channel (separate endpoint)
  let emailToken = null;
  try {
    const emailResp = await fetch('https://www.chatworks.chat/api/auth/email/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: deliveryEmail, service: 'chatworks' }),
    });
    if (emailResp.ok) {
      const emailData = await emailResp.json();
      emailToken = emailData.token;
    }
  } catch (_) {
    // Email delivery is best-effort; do not block login if it fails
  }

  return { ...data, emailToken };
}

export async function verifyWhatsAppOtp({ token, emailToken, code, phone }) {
  // Try WhatsApp token first
  const response = await fetch('https://www.chatworks.chat/api/auth/phone/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      code,
      phone,
      channel: 'whatsapp',
    }),
  });

  const data = await response.json();
  if (response.ok) {
    return data;
  }

  // If WhatsApp verification failed and we have an email token, try email verification
  if (emailToken) {
    const emailResp = await fetch('https://www.chatworks.chat/api/auth/email/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: emailToken, code }),
    });
    const emailData = await emailResp.json();
    if (emailResp.ok) {
      return emailData;
    }
  }

  throw new Error(data.error || 'Invalid verification code');
}
