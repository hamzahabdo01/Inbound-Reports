import { getEnvironments, platformAuth, setFanosAuthKey } from './fanos.ts'

export async function fetchEnvironments() {
  return getEnvironments()
}

export async function login(username: string, password: string, environmentCode: string) {
  const { data: platformData } = await platformAuth(username, password, environmentCode)
  const platformKey = platformData?.key || platformData?.Key
  if (!platformKey) {
    throw new Error('Platform authentication failed — no key returned')
  }

  setFanosAuthKey(platformKey)
  localStorage.setItem('token', platformKey)
  localStorage.setItem('platformKey', platformKey)

  return platformData
}

export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('platformKey')
  localStorage.removeItem('user')
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('user')
}

export function getToken(): string | null {
  return localStorage.getItem('token')
}

export function getUser() {
  const raw = localStorage.getItem('user')
  return raw ? JSON.parse(raw) : null
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('token')
}
