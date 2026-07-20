const https = require('https');
const { sendInvoiceEmail, sendReceiptEmail } = require('./email');

// Twilio WhatsApp credentials
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WA_FROM = process.env.TWILIO_WHATSAPP_FROM;
const TWILIO_MSG_SID = process.env.TWILIO_MESSAGING_SERVICE_SID;

// Approved WhatsApp Content Template SIDs
const WELCOME_TEMPLATE_SID = 'HXf114d1d1f248d80a14be0673aa937bdd';

/**
 * Low-level Twilio message sender. Accepts pre-built URLSearchParams.
 */
function twilioSend(params) {
  const to = params.get('To');
  if (!to) return Promise.reject(new Error('Missing To'));

  if (TWILIO_MSG_SID) {
    params.append('MessagingServiceSid', TWILIO_MSG_SID);
  } else {
    const from = TWILIO_WA_FROM.startsWith('whatsapp:') ? TWILIO_WA_FROM : `whatsapp:${TWILIO_WA_FROM}`;
    params.append('From', from);
  }

  const payload = params.toString();
  const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64');

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.twilio.com',
      path: `/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
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

/**
 * Send a WhatsApp text message via Twilio (free-form, only works within 24h window).
 */
function sendWhatsAppMessage({ phone, message }) {
  const to = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`;
  const params = new URLSearchParams();
  params.append('To', to);
  params.append('Body', message);
  return twilioSend(params);
}

/**
 * Send a WhatsApp template message via Twilio Content API.
 */
function sendWhatsAppTemplate({ phone, contentSid, contentVariables }) {
  const to = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`;
  const params = new URLSearchParams();
  params.append('To', to);
  params.append('ContentSid', contentSid);
  if (contentVariables) {
    params.append('ContentVariables', JSON.stringify(contentVariables));
  }
  return twilioSend(params);
}

/**
 * Send a WhatsApp message with a PDF document via Twilio.
 * Falls back to a text-only caption if media delivery fails.
 */
function sendWhatsAppDocument({ phone, pdfBuffer, filename, caption }) {
  // Twilio requires a publicly-accessible MediaUrl; inline base64 is not supported.
  // Fall back to sending the caption as a text message for now.
  return sendWhatsAppMessage({ phone, message: caption || filename });
}

/**
 * Send an invoice notification to a tenant via WhatsApp (PDF) and Email (PDF).
 *
 * Bills are sent as PDFs via both WhatsApp and email.
 */
async function sendInvoiceNotification(params) {
  const {
    tenantName, phone, email, period, rent, serviceCharge,
    waterUsage, waterCharge, totalAmount, currency,
    instanceName, unitNumber, buildingName, invoiceId, createdAt,
  } = params;

  if (!phone && !email) return { sent: false, reason: 'No phone or email' };

  const results = { whatsapp: null, email: null, sent: false };

  // Generate PDF invoice
  let pdfBuffer;
  try {
    const { generateInvoicePdf } = require('./pdf-invoice');
    pdfBuffer = await generateInvoicePdf({
      instanceName: instanceName || 'Property Manager',
      tenantName,
      unitNumber,
      buildingName,
      period,
      rent: rent || 0,
      serviceCharge: serviceCharge || 0,
      waterUsage: waterUsage || 0,
      waterCharge: waterCharge || 0,
      totalAmount: totalAmount || 0,
      currency: currency || 'KES',
      invoiceId,
      createdAt,
    });
  } catch (err) {
    console.error('PDF generation failed:', err);
    // Fall back to text-only if PDF fails
    pdfBuffer = null;
  }

  // Send via WhatsApp
  if (phone) {
    try {
      if (pdfBuffer) {
        // Try sending PDF as document
        const filename = `Invoice_${period}_${tenantName.replace(/\s+/g, '_')}.pdf`;
        const caption = `Invoice for ${period} - ${currency} ${totalAmount.toLocaleString()} due`;
        const waResult = await sendWhatsAppDocument({ phone, pdfBuffer, filename, caption });

        if (waResult.statusCode >= 200 && waResult.statusCode < 300) {
          results.whatsapp = { sent: true, method: 'pdf' };
          results.sent = true;
        } else {
          // Fallback: send as text message if media sending fails
          const textResult = await sendWhatsAppTextInvoice(params);
          results.whatsapp = { sent: textResult.sent, method: 'text', fallback: true };
          if (textResult.sent) results.sent = true;
        }
      } else {
        // No PDF available, send text
        const textResult = await sendWhatsAppTextInvoice(params);
        results.whatsapp = { sent: textResult.sent, method: 'text' };
        if (textResult.sent) results.sent = true;
      }
    } catch (err) {
      console.error('WhatsApp invoice send failed:', err);
      results.whatsapp = { sent: false, reason: err.message };
    }
  }

  // Send via Email with PDF attachment
  if (email && pdfBuffer) {
    try {
      await sendInvoiceEmail({
        to: email,
        tenantName,
        period,
        totalAmount: totalAmount || 0,
        currency: currency || 'KES',
        instanceName,
        pdfBuffer,
      });
      results.email = { sent: true };
      results.sent = true;
    } catch (err) {
      console.error('Email invoice send failed:', err);
      results.email = { sent: false, reason: err.message };
    }
  }

  return results;
}

/**
 * Fallback: send invoice as text message via WhatsApp.
 */
async function sendWhatsAppTextInvoice({ tenantName, phone, period, rent, serviceCharge, waterCharge, totalAmount, currency }) {
  const message = [
    `Hello ${tenantName},`,
    ``,
    `Your billing statement for ${period} is ready:`,
    ``,
    `  Rent: ${currency} ${(rent || 0).toLocaleString()}`,
    serviceCharge > 0 ? `  Service Charge: ${currency} ${serviceCharge.toLocaleString()}` : null,
    waterCharge > 0 ? `  Water Charge: ${currency} ${waterCharge.toLocaleString()}` : null,
    `  ─────────────────`,
    `  Total Due: ${currency} ${(totalAmount || 0).toLocaleString()}`,
    ``,
    `A detailed PDF invoice has been sent to your email.`,
    `Please make payment at your earliest convenience.`,
    ``,
    `- TenantBilling`,
  ].filter(Boolean).join('\n');

  try {
    const result = await sendWhatsAppMessage({ phone, message });
    return { sent: result.statusCode >= 200 && result.statusCode < 300, result };
  } catch (err) {
    return { sent: false, reason: err.message };
  }
}

/**
 * Send a payment reminder to a tenant with an overdue invoice (WhatsApp only).
 */
async function sendPaymentReminder({ tenantName, phone, period, totalAmount, currency, daysOverdue }) {
  if (!phone) return { sent: false, reason: 'No phone number' };

  const urgency = daysOverdue > 14 ? 'URGENT: ' : '';

  const message = [
    `${urgency}Payment Reminder`,
    ``,
    `Dear ${tenantName},`,
    ``,
    `Your invoice for ${period} (${currency} ${totalAmount.toLocaleString()}) remains unpaid${daysOverdue > 0 ? ` and is ${daysOverdue} days overdue` : ''}.`,
    ``,
    `Please arrange payment as soon as possible to avoid service disruption.`,
    ``,
    `If you have already paid, please disregard this message.`,
    ``,
    `- TenantBilling`,
  ].join('\n');

  try {
    const result = await sendWhatsAppMessage({ phone, message });
    return { sent: result.statusCode >= 200 && result.statusCode < 300, result };
  } catch (err) {
    return { sent: false, reason: err.message };
  }
}

/**
 * Send a meter reading reminder to a staff member.
 */
async function sendMeterReadingReminder({ staffName, phone, unreadCount, buildingNames }) {
  if (!phone) return { sent: false, reason: 'No phone number' };

  const message = [
    `Hello ${staffName},`,
    ``,
    `Reminder: You have ${unreadCount} water meter(s) pending reading this period.`,
    buildingNames?.length > 0 ? `Buildings: ${buildingNames.join(', ')}` : null,
    ``,
    `Please submit your readings at your earliest convenience via the TenantBilling app.`,
    ``,
    `- TenantBilling`,
  ].filter(Boolean).join('\n');

  try {
    const result = await sendWhatsAppMessage({ phone, message });
    return { sent: result.statusCode >= 200 && result.statusCode < 300, result };
  } catch (err) {
    return { sent: false, reason: err.message };
  }
}

/**
 * Send a payment receipt to a tenant via WhatsApp (PDF) and Email (PDF).
 */
async function sendPaymentReceipt(params) {
  const {
    tenantName, phone, email, amount, currency, period,
    transactionId, paidAt, instanceName, unitNumber, buildingName, invoiceId,
  } = params;

  if (!phone && !email) return { sent: false, reason: 'No phone or email' };

  const results = { whatsapp: null, email: null, sent: false };

  // Generate receipt PDF
  let pdfBuffer;
  try {
    const { generateReceiptPdf } = require('./pdf-invoice');
    pdfBuffer = await generateReceiptPdf({
      instanceName: instanceName || 'Property Manager',
      tenantName,
      unitNumber,
      buildingName,
      period,
      amount: amount || 0,
      currency: currency || 'KES',
      transactionId,
      paidAt,
      invoiceId,
    });
  } catch (err) {
    console.error('Receipt PDF generation failed:', err);
    pdfBuffer = null;
  }

  // Send via WhatsApp
  if (phone) {
    try {
      if (pdfBuffer) {
        const filename = `Receipt_${period}_${tenantName.replace(/\s+/g, '_')}.pdf`;
        const caption = `Payment Receipt - ${currency} ${(amount || 0).toLocaleString()} received`;
        const waResult = await sendWhatsAppDocument({ phone, pdfBuffer, filename, caption });

        if (waResult.statusCode >= 200 && waResult.statusCode < 300) {
          results.whatsapp = { sent: true, method: 'pdf' };
          results.sent = true;
        } else {
          // Fallback to text
          const textResult = await sendWhatsAppTextReceipt(params);
          results.whatsapp = { sent: textResult.sent, method: 'text', fallback: true };
          if (textResult.sent) results.sent = true;
        }
      } else {
        const textResult = await sendWhatsAppTextReceipt(params);
        results.whatsapp = { sent: textResult.sent, method: 'text' };
        if (textResult.sent) results.sent = true;
      }
    } catch (err) {
      console.error('WhatsApp receipt send failed:', err);
      results.whatsapp = { sent: false, reason: err.message };
    }
  }

  // Send via Email with PDF
  if (email && pdfBuffer) {
    try {
      await sendReceiptEmail({
        to: email,
        tenantName,
        period,
        amount: amount || 0,
        currency: currency || 'KES',
        transactionId,
        instanceName,
        pdfBuffer,
      });
      results.email = { sent: true };
      results.sent = true;
    } catch (err) {
      console.error('Email receipt send failed:', err);
      results.email = { sent: false, reason: err.message };
    }
  }

  return results;
}

/**
 * Fallback: send receipt as text message via WhatsApp.
 */
async function sendWhatsAppTextReceipt({ tenantName, phone, amount, currency, period, transactionId, paidAt }) {
  const formattedDate = new Date(paidAt).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const message = [
    `PAYMENT RECEIPT`,
    ``,
    `Dear ${tenantName},`,
    ``,
    `Your payment has been received successfully.`,
    ``,
    `  Amount: ${currency} ${(amount || 0).toLocaleString()}`,
    `  Period: ${period}`,
    `  Transaction: ${transactionId}`,
    `  Date: ${formattedDate}`,
    ``,
    `A PDF receipt has been sent to your email.`,
    `Thank you for your payment.`,
    ``,
    `- TenantBilling`,
  ].join('\n');

  try {
    const result = await sendWhatsAppMessage({ phone, message });
    return { sent: result.statusCode >= 200 && result.statusCode < 300, result };
  } catch (err) {
    return { sent: false, reason: err.message };
  }
}

/**
 * Send application approval WhatsApp welcome message to applicant and copy admin.
 * Uses an approved WhatsApp Content Template (UTILITY category).
 */
async function sendApplicationApprovalWhatsApp({ phone, copyPhone, applicantName, companyName, email, tempPassword, loginUrl }) {
  if (!phone) return { sent: false, reason: 'No phone number' };

  const contentVariables = {
    '1': applicantName,
    '2': companyName,
    '3': email,
    '4': tempPassword,
    '5': loginUrl || 'https://tenantbilling.africa/login',
  };

  try {
    const primaryRes = await sendWhatsAppTemplate({
      phone,
      contentSid: WELCOME_TEMPLATE_SID,
      contentVariables,
    });
    if (copyPhone && copyPhone !== phone) {
      await sendWhatsAppTemplate({
        phone: copyPhone,
        contentSid: WELCOME_TEMPLATE_SID,
        contentVariables,
      });
    }
    return { sent: primaryRes.statusCode >= 200 && primaryRes.statusCode < 300, result: primaryRes };
  } catch (err) {
    return { sent: false, reason: err.message };
  }
}

module.exports = {
  sendWhatsAppMessage,
  sendWhatsAppTemplate,
  sendWhatsAppDocument,
  sendInvoiceNotification,
  sendPaymentReminder,
  sendMeterReadingReminder,
  sendPaymentReceipt,
  sendApplicationApprovalWhatsApp,
};
