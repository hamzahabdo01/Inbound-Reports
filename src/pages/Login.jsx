import { useState } from 'react'

const VALID_USERNAME = 'TestAdmin'
const VALID_PASSWORD = 'pass2pass'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [focusedField, setFocusedField] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!username.trim()) { setError('Username is required'); return }
    if (!password.trim()) { setError('Password is required'); return }

    if (username.trim() !== VALID_USERNAME || password !== VALID_PASSWORD) {
      setError('Invalid username or password')
      return
    }

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      onLogin?.()
    }, 800)
  }

  return (
    <div className="min-h-screen flex">
      {/* Brand Panel */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] relative flex-col bg-[#00373B] p-12 overflow-hidden">


        <div className="relative z-10 -ml-12">
          <img src="/epss-logo.png" alt="EPSS" className="h-28 w-auto" style={{ filter: 'brightness(0) invert(1)' }} />
        </div>

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
        <img src="/gemini-svg.svg" alt="" className="absolute -top-12 -right-40 w-[800px] pointer-events-none select-none brightness-0 invert" />

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

      {/* Form Panel */}
      <div className="flex-1 flex items-center justify-center bg-[#F6FAFC] px-6 py-12">
        <div className="w-full max-w-sm animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden mb-10">
            <img src="/epss-logo.png" alt="EPSS" className="h-10 w-auto" />
          </div>

          <div className="mb-8">
            <h2 className="text-[28px] font-bold text-on-surface tracking-tight">Welcome back</h2>
            <p className="mt-2 text-body-md text-on-surface-variant">Sign in to access the dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-label-sm text-on-surface mb-1.5">Username</label>
              <div className={`relative rounded-lg border transition-all duration-200 ${error && !username.trim() ? 'border-error ring-2 ring-error/10' : focusedField === 'username' ? 'border-primary ring-2 ring-primary/10' : 'border-outline-variant hover:border-outline'}`}>
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <i className={`fa-solid fa-user text-sm ${focusedField === 'username' ? 'text-primary' : 'text-on-surface-variant/50'}`} />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  className="w-full h-12 pl-10 pr-4 bg-transparent text-body-md text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-label-sm text-on-surface mb-1.5">Password</label>
              <div className={`relative rounded-lg border transition-all duration-200 ${error && !password.trim() ? 'border-error ring-2 ring-error/10' : focusedField === 'password' ? 'border-primary ring-2 ring-primary/10' : 'border-outline-variant hover:border-outline'}`}>
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <i className={`fa-solid fa-lock text-sm ${focusedField === 'password' ? 'text-primary' : 'text-on-surface-variant/50'}`} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full h-12 pl-10 pr-10 bg-transparent text-body-md text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-on-surface-variant/50 hover:text-on-surface-variant transition-colors"
                  tabIndex={-1}
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/30 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-body-sm text-on-surface-variant">Remember me</span>
            </label>

            {error && (
              <div className="flex items-center gap-2 text-body-sm text-error bg-error/5 rounded-lg px-4 py-3 animate-fade-in">
                <i className="fa-solid fa-circle-exclamation text-sm" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="relative w-full h-12 rounded-lg bg-primary text-white text-label-sm font-semibold hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 overflow-hidden"
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
          </form>

          <div className="mt-8 text-center">
            <p className="text-body-sm text-on-surface-variant">
              Protected by enterprise-grade security.{' '}
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
