import api from './api';

export const listPayments = (params) => api.get('/payments', { params });
export const initiatePayment = (data) => api.post('/payments/initiate', data);
