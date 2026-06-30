import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { login as authLogin, logout as authLogout, isAuthenticated, getToken, validateSession } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [loggedIn, setLoggedIn] = useState(isAuthenticated())
  const [validating, setValidating] = useState(true)

  useEffect(() => {
    let cancelled = false
    if (isAuthenticated()) {
      validateSession().then((valid) => {
        if (cancelled) return
        if (!valid) {
          authLogout()
          setLoggedIn(false)
        }
        setValidating(false)
      })
    } else {
      setValidating(false)
    }
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const handler = () => {
      authLogout()
      setLoggedIn(false)
    }
    window.addEventListener('auth:expired', handler)
    return () => window.removeEventListener('auth:expired', handler)
  }, [])

  const login = useCallback(async (username, password, environmentCode) => {
    await authLogin(username, password, environmentCode)
    setLoggedIn(true)
  }, [])

  const logout = useCallback(() => {
    authLogout()
    setLoggedIn(false)
  }, [])

  const value = {
    loggedIn,
    validating,
    token: getToken(),
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
