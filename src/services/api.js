import axios from 'axios';
import config from '../config';

const api = axios.create({
  baseURL: config.apiUrl,
  headers: { 'Content-Type': 'application/json' },
});

// JWT interceptor: attach token to every request
api.interceptors.request.use((reqConfig) => {
  const token = localStorage.getItem('tb_id_token');
  if (token) {
    reqConfig.headers.Authorization = `Bearer ${token}`;
  }
  return reqConfig;
});

// Response interceptor: handle 401 by clearing auth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('tb_id_token');
      localStorage.removeItem('tb_user');
      localStorage.removeItem('tb_mfa_verified');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
