import api from './api';

export const createApplication = (data) => api.post('/applications', data);
export const listApplications = () => api.get('/applications');
export const approveApplication = (id) => api.put(`/applications/${id}/approve`);
export const rejectApplication = (id) => api.put(`/applications/${id}/reject`);
export const suspendApplication = (id) => api.put(`/applications/${id}/suspend`);
