import api from './api';

export const listInvoices = (params) => api.get('/invoices', { params });
export const generateInvoices = (data) => api.post('/invoices/generate', data);
export const updateInvoice = (id, data) => api.put(`/invoices/${id}`, data);
