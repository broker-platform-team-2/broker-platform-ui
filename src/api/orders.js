import { api } from './client';

export async function placeOrder({ instrumentType, instrumentId, orderType, side, quantity, limitPrice, expiresAt, currency }) {
  const { data } = await api.post('/orders', {
    instrumentType, instrumentId, orderType, side, quantity, limitPrice, expiresAt, currency,
  });
  return data;
}

export async function getOrder(orderId) {
  const { data } = await api.get(`/orders/${orderId}`);
  return data;
}

export async function cancelOrder(orderId) {
  await api.delete(`/orders/${orderId}`);
}
