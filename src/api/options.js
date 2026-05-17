import { api } from './client';

export async function getOptions() {
  const { data } = await api.get('/options');
  return Array.isArray(data) ? data : [];
}
