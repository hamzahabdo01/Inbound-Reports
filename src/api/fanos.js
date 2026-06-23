import axios from 'axios';

const fanosClient = axios.create({
  baseURL: 'https://fanosdash-api.moh.gov.et',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': 'Basic a286541a-8e08-4705-8a10-da7fbc841c85',
  },
});

export async function getEnvironments() {
  const { data } = await fanosClient.get('/api/EN_WebApi/ByEnvironmentCode');
  return data;
}

export const platformAuth = (username, password, environmentCode) =>
  fanosClient.post('/api/AccountManager/AuthenticateWithPlatformIdentifiera', null, {
    params: {
      userName: username,
      password,
      environmentCode: environmentCode || '',
      deviceIdentifier: 'unknown',
      deviceType: 'web',
      hcmisVersion: 'unknown',
    },
  });

export default fanosClient;
