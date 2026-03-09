import { useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { Spinner } from '../components/common/Spinner'

export default function Login() {
  const { login } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)
    const err = await login(email, password, isSignUp)
    setLoading(false)
    if (err) {
      setError(err)
    } else if (isSignUp) {
      setInfo('Account created. Check your email to confirm, then sign in.')
      setIsSignUp(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)] p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="font-bold text-blue-400 tracking-widest text-xl">CRYPTO-PORTF</span>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Portfolio Manager</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--color-text-muted)]">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--color-text-muted)]">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <span>✗</span> {error}
            </p>
          )}
          {info && (
            <p className="text-xs text-green-400 flex items-center gap-1">
              <span>✓</span> {info}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md px-4 py-2 text-sm font-medium transition-colors"
          >
            {loading && <Spinner size="sm" />}
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-[var(--color-text-muted)]">
          {isSignUp ? 'Already have an account?' : 'First time?'}{' '}
          <button
            onClick={() => { setIsSignUp(v => !v); setError(null); setInfo(null) }}
            className="text-blue-400 hover:text-blue-300 underline"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  )
}
