/**
 * Service for sending and verifying WhatsApp OTPs via ChatWorks API
 */

export async function sendWhatsAppOtp(fullPhone) {
  if (!fullPhone) {
    throw new Error('Phone number is required');
  }

  let countryCode = '+254';
  let localPhone = fullPhone.replace(/\D/g, '');

  if (fullPhone.startsWith('+')) {
    const knownCodes = ['+251', '+254', '+255', '+256', '+250'];
    const foundCode = knownCodes.find((c) => fullPhone.startsWith(c));
    if (foundCode) {
      countryCode = foundCode;
      localPhone = fullPhone.slice(foundCode.length);
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

  const response = await fetch('https://www.chatworks.chat/api/auth/phone/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      countryCode,
      localPhone,
      channel: 'whatsapp',
      service: 'chatworks',
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to send WhatsApp OTP');
  }
  return data;
}

export async function verifyWhatsAppOtp({ token, code, phone }) {
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
  if (!response.ok) {
    throw new Error(data.error || 'Invalid verification code');
  }
  return data;
}
