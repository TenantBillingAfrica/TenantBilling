import api from './api';

export const requestTenantOtp = (phone) => api.post('/tenant-portal/request-otp', { phone });
export const verifyTenantOtp = (data) => api.post('/tenant-portal/verify-otp', data);
export const getTenantStatement = (data) => api.post('/tenant-portal/statement', data);
