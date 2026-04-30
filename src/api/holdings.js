import { api } from './client';

export async function getMyHoldings() {
  const { data } = await api.get('/holdings');
  return data;
}

export async function getPortfolio() {
  const { data } = await api.get('/portfolio');
  return data;
}
