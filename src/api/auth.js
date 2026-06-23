import { getEnvironments, platformAuth } from './fanos';
import { loginUser } from './dagudash';

export async function fetchEnvironments() {
  return getEnvironments();
}

export async function login(username, password, environmentCode) {
  const { data: platformData } = await platformAuth(username, password, environmentCode);
  const platformKey = platformData?.key || platformData?.Key;
  if (!platformKey) {
    throw new Error('Platform authentication failed — no key returned');
  }
  const userData = await loginUser({ username, password, platformKey });
  const token = userData.token || userData.Token;
  if (token) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  }
  return userData;
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getToken() {
  return localStorage.getItem('token');
}

export function getUser() {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

export function isAuthenticated() {
  return !!localStorage.getItem('token');
}
