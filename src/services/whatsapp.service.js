/**
 * Service for sending and verifying OTPs via ChatWorks API (WhatsApp + Email)
 */

const adminPhoneMap = {
  'inashuriye@gmail.com': '+254722265670',
  'administrator@tenantbilling.africa': '+254717124662',
};

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

export async function sendWhatsAppOtp(fullPhone, email) {
  let phoneToUse = fullPhone;
  if (!phoneToUse || phoneToUse.includes('*')) {
    phoneToUse = adminPhoneMap[email] || '+254722265670';
  }

  const { countryCode, localPhone } = decomposePhone(phoneToUse);

  // Send OTP via WhatsApp channel
  const response = await fetch('https://www.chatworks.chat/api/auth/phone/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      countryCode,
      localPhone,
      email,
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
      body: JSON.stringify({ email, service: 'chatworks' }),
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
