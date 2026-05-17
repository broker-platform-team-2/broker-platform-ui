import { api } from './client';

export async function getBotStatus() {
  const { data } = await api.get('/bots/status');
  return data;
}

export async function subscribeBot(currency = 'USD') {
  const { data } = await api.post(`/bots/subscribe?currency=${currency}`);
  return data;
}

export async function startBot() {
  const { data } = await api.post('/bots/start');
  return data;
}

export async function stopBot() {
  const { data } = await api.post('/bots/stop');
  return data;
}