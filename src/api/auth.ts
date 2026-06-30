import { getEnvironments, platformAuth, setFanosAuthKey, validateAuthKey } from './fanos.ts'

export const STORAGE_KEY = 'platformKey'

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
  sessionStorage.setItem(STORAGE_KEY, platformKey)

  return platformData
}

export function logout() {
  const key = sessionStorage.getItem(STORAGE_KEY)
  sessionStorage.removeItem(STORAGE_KEY)
  sessionStorage.removeItem('user')
  localStorage.removeItem('user')
  setFanosAuthKey('')
  return key
}

export function getToken(): string | null {
  return sessionStorage.getItem(STORAGE_KEY)
}

export function getUser() {
  const raw = sessionStorage.getItem('user') || localStorage.getItem('user')
  return raw ? JSON.parse(raw) : null
}

export function isAuthenticated(): boolean {
  const key = sessionStorage.getItem(STORAGE_KEY)
  return !!key
}

export async function validateSession(): Promise<boolean> {
  const key = sessionStorage.getItem(STORAGE_KEY)
  if (!key) return false
  try {
    return await validateAuthKey()
  } catch {
    return false
  }
}
