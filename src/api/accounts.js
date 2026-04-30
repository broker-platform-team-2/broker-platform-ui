import { api } from './client';

export async function getMyAccount() {
  const { data } = await api.get('/accounts/me');
  return data;
}

export async function getBalance() {
  const { data } = await api.get('/funds/balance');
  return data; // { available, frozen, total, currency }
}

export async function deposit(amount) {
  const { data } = await api.post('/funds/deposit', { amount });
  return data;
}
