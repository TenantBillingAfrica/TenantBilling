import api from './api';

export const sendInvoiceNotifications = (data) => api.post('/notifications/send-invoices', data || {});
export const sendPaymentReminders = (data) => api.post('/notifications/send-reminders', data || {});
export const sendMeterReadingReminders = () => api.post('/notifications/send-meter-reminders', {});
