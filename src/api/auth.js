import { api } from './client';

// POST /users/register -> AuthResponse { token, userId, username, email }
export async function register({ email, username, password }) {
  const { data } = await api.post('/users/register', { email, username, password });
  return data;
}

export async function login({ email, password }) {
  const { data } = await api.post('/users/login', { email, password });
  return data;
}

export async function forgotPassword(email) {
  await api.post('/users/forgot-password', { email });
}

export async function resetPassword({ token, newPassword }) {
  await api.post('/users/reset-password', { token, newPassword });
}

export async function changePassword({ userId, oldPassword, newPassword }) {
  await api.put(`/users/${userId}/password`, { oldPassword, newPassword });
}

export async function verifyEmail(token) {
  await api.get('/users/verify-email', { params: { token } });
}
