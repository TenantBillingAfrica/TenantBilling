import api from './api';

export const listTenants = (buildingId) =>
  api.get('/tenants', { params: buildingId ? { buildingId } : {} });
export const createTenant = (data) => api.post('/tenants', data);
export const updateTenant = (id, data) => api.put(`/tenants/${id}`, data);
export const deleteTenant = (id) => api.delete(`/tenants/${id}`);
