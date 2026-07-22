const https = require('https');

const API_TOKEN = process.env.CHATWORKS_API_TOKEN;
const COLLECTIONS_URL = process.env.CHATWORKS_COLLECTIONS_URL;
const CALLBACK_URL = process.env.CHATWORKS_CALLBACK_URL;

/**
 * Initiate a mobile money collection via ChatWorks/PawaPay.
 */
function initiateCollection({ transactionId, phone, amount, currency, correspondent, description }) {
  const payload = JSON.stringify({
    depositId: transactionId,
    amount: String(amount),
    currency,
    correspondent: correspondent || 'MTN_MOMO_UGD',
    payer: {
      type: 'MSISDN',
      address: { value: phone },
    },
    statementDescription: description || 'TenantBilling payment',
    callbackUrl: CALLBACK_URL,
  });

  const url = new URL(COLLECTIONS_URL);

  const options = {
    hostname: url.hostname,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Length': Buffer.byteLength(payload),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

module.exports = { initiateCollection };
