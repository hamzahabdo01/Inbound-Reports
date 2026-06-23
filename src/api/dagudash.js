import axios from 'axios';

const dagudashApi = axios.create({
  baseURL: 'https://dagudash-be.dh.moh.gov.et',
  headers: { 'Content-Type': 'application/json' },
});

dagudashApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function loginUser({ username, password, platformKey }) {
  const { data } = await dagudashApi.post(
    '/api/Account/Login',
    { username, password },
    { headers: { Authorization: `Basic ${platformKey}` } }
  );
  return data;
}

export default dagudashApi;
