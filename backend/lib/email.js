const { SESClient, SendRawEmailCommand } = require('@aws-sdk/client-ses');

const ses = new SESClient({});
const FROM_EMAIL = process.env.SES_FROM_EMAIL || 'invoices@tenantbilling.africa';

/**
 * Send an email with a PDF attachment via AWS SES.
 *
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.subject - Email subject
 * @param {string} params.textBody - Plain text body
 * @param {string} params.htmlBody - HTML body
 * @param {Buffer} params.pdfBuffer - PDF file content
 * @param {string} params.pdfFilename - Filename for the attachment
 * @returns {Promise<Object>} SES send result
 */
async function sendEmailWithPdf({ to, subject, textBody, htmlBody, pdfBuffer, pdfFilename }) {
  if (!to) throw new Error('Recipient email is required');

  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const pdfBase64 = pdfBuffer.toString('base64');

  const rawMessage = [
    `From: TenantBilling <${FROM_EMAIL}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: multipart/alternative; boundary="${boundary}_alt"`,
    ``,
    `--${boundary}_alt`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    textBody,
    ``,
    `--${boundary}_alt`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    htmlBody,
    ``,
    `--${boundary}_alt--`,
    ``,
    `--${boundary}`,
    `Content-Type: application/pdf; name="${pdfFilename}"`,
    `Content-Disposition: attachment; filename="${pdfFilename}"`,
    `Content-Transfer-Encoding: base64`,
    ``,
    // Split base64 into 76-char lines per MIME spec
    ...pdfBase64.match(/.{1,76}/g),
    ``,
    `--${boundary}--`,
  ].join('\r\n');

  const command = new SendRawEmailCommand({
    RawMessage: { Data: Buffer.from(rawMessage) },
    Source: FROM_EMAIL,
    Destinations: [to],
  });

  return ses.send(command);
}

/**
 * Send an invoice PDF email to a tenant.
 */
async function sendInvoiceEmail({ to, tenantName, period, totalAmount, currency, instanceName, pdfBuffer }) {
  const subject = `Your Invoice for ${formatPeriod(period)} - ${currency} ${totalAmount.toLocaleString()}`;
  const pdfFilename = `Invoice_${period}_${tenantName.replace(/\s+/g, '_')}.pdf`;

  const textBody = [
    `Dear ${tenantName},`,
    ``,
    `Please find attached your invoice for ${formatPeriod(period)}.`,
    ``,
    `Total Amount Due: ${currency} ${totalAmount.toLocaleString()}`,
    ``,
    `Payment can be made via mobile money. You will receive a payment prompt on your phone when your property manager initiates collection.`,
    ``,
    `If you have any questions, please contact your property manager.`,
    ``,
    `Best regards,`,
    `${instanceName || 'Your Property Manager'}`,
    `Powered by TenantBilling`,
  ].join('\n');

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a2e; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Invoice</h1>
    <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">${formatPeriod(period)}</p>
  </div>
  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
    <p>Dear <strong>${tenantName}</strong>,</p>
    <p>Please find attached your invoice for <strong>${formatPeriod(period)}</strong>.</p>
    <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0;">Total Amount Due</p>
      <p style="font-size: 32px; font-weight: 800; color: #1a1a2e; margin: 8px 0 0;">${currency} ${totalAmount.toLocaleString()}</p>
    </div>
    <p style="font-size: 14px; color: #6b7280;">Payment can be made via mobile money. You will receive a payment prompt on your phone when your property manager initiates collection.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    <p style="font-size: 12px; color: #9ca3af; text-align: center;">
      ${instanceName || 'Your Property Manager'}<br>
      Powered by <a href="https://www.tenantbilling.africa" style="color: #667eea;">TenantBilling</a>
    </p>
  </div>
</body>
</html>`;

  return sendEmailWithPdf({ to, subject, textBody, htmlBody, pdfBuffer, pdfFilename });
}

/**
 * Send a payment receipt PDF email to a tenant.
 */
async function sendReceiptEmail({ to, tenantName, period, amount, currency, transactionId, instanceName, pdfBuffer }) {
  const subject = `Payment Receipt - ${currency} ${amount.toLocaleString()} for ${formatPeriod(period)}`;
  const pdfFilename = `Receipt_${period}_${tenantName.replace(/\s+/g, '_')}.pdf`;

  const textBody = [
    `Dear ${tenantName},`,
    ``,
    `Your payment has been received successfully. Please find your receipt attached.`,
    ``,
    `Amount: ${currency} ${amount.toLocaleString()}`,
    `Period: ${formatPeriod(period)}`,
    `Transaction: ${transactionId}`,
    ``,
    `Thank you for your payment.`,
    ``,
    `Best regards,`,
    `${instanceName || 'Your Property Manager'}`,
    `Powered by TenantBilling`,
  ].join('\n');

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a2e; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Payment Receipt</h1>
    <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">${formatPeriod(period)}</p>
  </div>
  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
    <p>Dear <strong>${tenantName}</strong>,</p>
    <p>Your payment has been received successfully. Please find your receipt attached.</p>
    <div style="background: #ecfdf5; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; border: 1px solid #a7f3d0;">
      <p style="color: #065f46; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0;">Amount Received</p>
      <p style="font-size: 32px; font-weight: 800; color: #065f46; margin: 8px 0 0;">${currency} ${amount.toLocaleString()}</p>
      <p style="color: #10b981; font-size: 14px; font-weight: 600; margin: 8px 0 0;">PAID IN FULL</p>
    </div>
    <table style="width: 100%; font-size: 13px; color: #6b7280;">
      <tr><td style="padding: 4px 0;">Transaction ID:</td><td style="text-align: right; font-family: monospace;">${transactionId}</td></tr>
      <tr><td style="padding: 4px 0;">Period:</td><td style="text-align: right;">${formatPeriod(period)}</td></tr>
    </table>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    <p style="font-size: 12px; color: #9ca3af; text-align: center;">
      Thank you for your payment.<br>
      ${instanceName || 'Your Property Manager'}<br>
      Powered by <a href="https://www.tenantbilling.africa" style="color: #10b981;">TenantBilling</a>
    </p>
  </div>
</body>
</html>`;

  return sendEmailWithPdf({ to, subject, textBody, htmlBody, pdfBuffer, pdfFilename });
}

function formatPeriod(period) {
  if (!period) return '-';
  const [year, month] = period.split('-');
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[parseInt(month, 10) - 1] || month} ${year}`;
}

module.exports = { sendEmailWithPdf, sendInvoiceEmail, sendReceiptEmail };
