import api from './api';

export async function getSettings() {
  const res = await api.get('/admin/settings');
  return res.data;
}

export async function saveSettings(data) {
  const res = await api.put('/admin/settings', data);
  return res.data;
}
