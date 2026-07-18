import api from './api';

export const listMeterReadings = (params) => api.get('/meter-readings', { params });
export const createMeterReading = (data) => api.post('/meter-readings', data);
