import config from '../config';

export async function sendWhatsAppOtp(fullPhone, email) {
  const response = await fetch(`${config.apiUrl}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: fullPhone,
      email,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to send verification code');
  }

  return data;
}

export async function verifyWhatsAppOtp({ token, emailToken, code, phone }) {
  const response = await fetch(`${config.apiUrl}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      emailToken,
      code,
      phone,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Invalid verification code');
  }

  return data;
}
