import { useState, useEffect, useRef } from 'react'
import { fetchEnvironments } from '../api/auth.ts'
import { useAuth } from '../contexts/AuthContext'
import LoginCanvasAnimation from '../components/LoginCanvasAnimation'

export default function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [focusedField, setFocusedField] = useState(null)
  const [environments, setEnvironments] = useState([])
  const [selectedEnv, setSelectedEnv] = useState(null)
  const [showEnvPanel, setShowEnvPanel] = useState(false)
  const [envPanelClosing, setEnvPanelClosing] = useState(false)

  const closeEnvPanel = () => {
    setEnvPanelClosing(true)
    setTimeout(() => { setShowEnvPanel(false); setEnvPanelClosing(false) }, 250)
  }

  const fetched = useRef(false)
  useEffect(() => {
    if (fetched.current) return
    fetched.current = true
    fetchEnvironments()
      .then((res) => {
        const list = (res as any)?.Data || (Array.isArray(res) ? res : [])
        setEnvironments(list)
      })
      .catch(() => {})
  }, [])

  const handleLogin = async () => {
    setError('')

    if (!username.trim()) { setError('Username is required'); return }
    if (!password.trim()) { setError('Password is required'); return }
    if (!selectedEnv) { setError('Please select a region/site.'); return }

    setLoading(true)
    try {
      await login(username.trim(), password, selectedEnv?.EnvironmentCode || '')
    } catch (err) {
      if (err.code === 'ERR_NETWORK') {
        setError('Unable to connect to the server. Please check your network connection.')
      } else if (err.response) {
        const status = err.response.status
        const data = err.response.data
        if (status === 401) {
          setError('Invalid username or password.')
        } else if (status === 403) {
          setError('Your account does not have permission to access this system.')
        } else if (status === 429) {
          setError('Too many login attempts. Please wait a moment and try again.')
        } else if (status >= 500) {
          setError('Server error. Please try again later.')
        } else {
          setError(data?.message || data?.title || data?.detail || 'Login failed. Please try again.')
        }
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px white inset !important;
          -webkit-text-fill-color: #111827 !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
    <div className="min-h-screen flex-col lg:flex-row flex overflow-hidden">
      {/* Brand Panel */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] relative flex-col bg-[#00373B] p-12 overflow-hidden">
        <div className="relative z-10 -ml-12">
          <img src="/epss-logo.png" alt="EPSS" className="h-28 w-auto" style={{ filter: 'brightness(0) invert(1)' }} />
        </div>
        <img src="/gemini-svg.svg" alt="" className="absolute -top-12 -right-40 w-[800px] pointer-events-none select-none brightness-0 invert" />
        <div className="relative z-10 mt-8">
          <h1 className="text-[40px] leading-[48px] font-bold text-white tracking-tight">
            Fanos Dashboard
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[#86BFC5]/80 max-w-sm">
            For monitoring shipments and procurement across Ethiopia's medical supply network.
          </p>

          <div className="mt-8 space-y-4">
            {[
              { icon: 'fa-truck-fast', text: 'Real-time shipment tracking' },
              { icon: 'fa-boxes-stacked', text: 'Multi-program inventory management' },
              { icon: 'fa-chart-line', text: 'Data-driven procurement insights' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#86BFC5]/10 flex items-center justify-center">
                  <i className={`fa-solid ${item.icon} text-sm text-[#86BFC5]`} />
                </div>
                <span className="text-sm text-[#86BFC5]/70">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 mt-auto pt-12 space-y-3">
          <div className="flex items-center gap-4 text-[#86BFC5]/40 text-[11px] font-medium">
            <span>HIPAA Compliant</span>
            <span className="w-px h-3 bg-[#86BFC5]/20" />
            <span>ISO 27001</span>
            <span className="w-px h-3 bg-[#86BFC5]/20" />
            <span>SSL Encrypted</span>
          </div>
          <p className="text-xs text-[#86BFC5]/30">&copy; 2026 Ethiopian Pharmaceuticals Supply Service. All rights reserved.</p>
        </div>
      </div>

      {/* Mobile Brand Panel */}
      <div className="lg:hidden flex flex-col items-center justify-center bg-primary pt-16 pb-12 px-6">
        <div className="w-48 h-24 mb-4" style={{ backgroundColor: 'white', WebkitMask: 'url(/gemini-svg.svg) no-repeat center / contain', mask: 'url(/gemini-svg.svg) no-repeat center / contain' }} />
        <h1 className="text-2xl font-bold text-white tracking-tight">Fanos Dashboard</h1>
      </div>

      {/* Form Panel */}
      <div className="flex-1 relative overflow-hidden flex flex-col items-center pt-6 px-6 bg-transparent lg:pt-0 lg:flex-row lg:items-center lg:justify-center">
        <div className="hidden lg:block absolute inset-0">
          <LoginCanvasAnimation />
        </div>

        <div className="w-full max-w-[420px] animate-slide-up relative z-10">
          <div className="hidden lg:block mb-8 text-center lg:text-left">
            <h2 className="text-2xl sm:text-[30px] font-bold text-on-surface tracking-tight">Welcome back</h2>
            <p className="mt-1.5 text-body-md text-[#6B7280]">Sign in to access the dashboard</p>
          </div>

          <div className="space-y-5">
            <div>
              <div className={`relative rounded-lg border transition-all duration-200 bg-white ${error && !username.trim() ? 'border-error ring-2 ring-error/10' : focusedField === 'username' ? 'border-[#1a4a47] shadow-[0_0_0_3px_rgba(26,74,71,0.15)]' : 'border-[#B8C4CA] lg:border-[#CFD8DC] hover:border-[#1a4a47]/40'}`}>
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <i className={`fa-solid fa-user text-sm ${focusedField === 'username' ? 'text-[#1a4a47]' : 'text-[#9CA3AF]'}`} />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(''); }}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Username"
                  autoComplete="off"
                  className="w-full h-12 pl-10 pr-4 bg-white text-body-md text-on-surface placeholder:text-[#9CA3AF] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className={`relative rounded-lg border transition-all duration-200 bg-white ${error && !password.trim() ? 'border-error ring-2 ring-error/10' : focusedField === 'password' ? 'border-[#1a4a47] shadow-[0_0_0_3px_rgba(26,74,71,0.15)]' : 'border-[#B8C4CA] lg:border-[#CFD8DC] hover:border-[#1a4a47]/40'}`}>
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <i className={`fa-solid fa-lock text-sm ${focusedField === 'password' ? 'text-[#1a4a47]' : 'text-[#9CA3AF]'}`} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Password"
                  autoComplete="off"
                  className="w-full h-12 pl-10 pr-10 bg-white text-body-md text-on-surface placeholder:text-[#9CA3AF] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#9CA3AF] hover:text-on-surface-variant transition-colors"
                  tabIndex={-1}
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                </button>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowEnvPanel(true)}
                 className={`w-full h-12 flex items-center gap-3 px-3.5 rounded-lg border transition-all duration-200 text-left bg-white ${selectedEnv ? 'border-[#1a4a47] shadow-[0_0_0_3px_rgba(26,74,71,0.15)]' : 'border-[#CFD8DC] hover:border-[#1a4a47]/40'}`}
              >
                <i className="fa-solid fa-location-dot text-sm text-[#1a4a47]" />
                <span className="flex-1 text-body-md text-on-surface font-medium">{selectedEnv?.Environment || 'Select site'}</span>
                <i className="fa-solid fa-chevron-right text-xs text-[#9CA3AF]" />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-body-sm text-error bg-error/5 rounded-lg px-4 py-3 animate-fade-in">
                <i className="fa-solid fa-circle-exclamation text-sm" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleLogin}
              onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
              disabled={loading}
              className="relative w-full h-12 rounded-lg bg-[#1a4a47] text-white text-label-sm hover:bg-[#1f5a56] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 overflow-hidden"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="fa-solid fa-spinner text-sm animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          {/* Mobile footer */}
          <div className="lg:hidden mt-8 text-center space-y-3">
            <div className="flex items-center justify-center gap-4 text-[#9CA3AF] text-[8px] font-medium">
              <span>HIPAA Compliant</span>
              <span className="w-px h-3 bg-[#CFD8DC]" />
              <span>ISO 27001</span>
              <span className="w-px h-3 bg-[#CFD8DC]" />
              <span>SSL Encrypted</span>
            </div>
            <p className="text-[9px] text-[#9CA3AF]/60">&copy; 2026 Ethiopian Pharmaceuticals Supply Service. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Site Panel */}
      {showEnvPanel && (
        <div className="fixed inset-0 z-50 flex flex-row">
          <div className={`flex-1 bg-black/20 backdrop-blur-sm animate-fade-in ${envPanelClosing ? 'animate-fade-out' : ''}`} onClick={closeEnvPanel} />
          <div className={`w-[300px] lg:w-[400px] bg-[#0B4F54] shadow-2xl flex flex-col rounded-none ${envPanelClosing ? 'animate-slide-to-right' : 'animate-slide-from-right'}`}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white tracking-tight">Select Site</h3>
              <button onClick={closeEnvPanel} className="w-11 h-11 lg:w-8 lg:h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-white/60">
                <i className="fa-solid fa-xmark text-lg" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {environments.length === 0 ? (
                <div className="px-6 py-8 text-center text-white/50 text-body-sm">No sites available</div>
              ) : environments.map((env, i) => (
                <button
                  key={env.EnvironmentCode || `env-${i}`}
                  onClick={() => { setSelectedEnv(env); closeEnvPanel() }}
                  className={`w-full flex items-center gap-3 px-6 py-3 text-left text-body-md transition-colors hover:bg-white/10 ${env.EnvironmentCode === selectedEnv?.EnvironmentCode ? 'bg-white/15 text-white font-semibold' : 'text-white/70'}`}
                >
                  <i className={`fa-solid fa-location-dot text-sm w-4 ${env.EnvironmentCode === selectedEnv?.EnvironmentCode ? 'text-white' : 'text-white/40'}`} />
                  <span className="flex-1">{env.Environment}</span>
                  {env.EnvironmentCode === selectedEnv?.EnvironmentCode && <i className="fa-solid fa-check text-white text-sm" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
    </>
  )
}

