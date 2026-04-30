import { api } from './client';

export async function getMyTransactions() {
  const { data } = await api.get('/transactions');
  return data;
}
