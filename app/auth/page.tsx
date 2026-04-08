'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode]       = useState<'signin' | 'signup'>('signin')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    const res  = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, mode }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.error) { setError(data.error); return }
    router.push('/')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f2ed', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: '48px', letterSpacing: '-2px', color: '#1a1a1f', lineHeight: 1 }}>
            fitted<span style={{ color: '#2d5be3' }}>.</span>
          </div>
          <div style={{ fontSize: '13px', color: '#b8a99a', fontWeight: 300, marginTop: '6px' }}>
            get a career tailor-made for you
          </div>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', border: '1px solid rgba(0,0,0,.07)' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', color: '#1a1a1f', margin: '0 0 6px', fontWeight: 400 }}>
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p style={{ fontSize: '13px', color: '#7a7a85', margin: '0 0 24px' }}>
            {mode === 'signin' ? 'Sign in to your fitted. account' : 'Start building your tailor-made career'}
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#3d3d45', marginBottom: '6px' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0,0,0,.13)', borderRadius: '8px', fontSize: '14px', fontFamily: 'sans-serif', color: '#1a1a1f', background: '#f4f2ed', outline: 'none', boxSizing: 'border-box' as const }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#3d3d45', marginBottom: '6px' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0,0,0,.13)', borderRadius: '8px', fontSize: '14px', fontFamily: 'sans-serif', color: '#1a1a1f', background: '#f4f2ed', outline: 'none', boxSizing: 'border-box' as const }}
              />
            </div>

            {error && (
              <div style={{ background: '#fdecea', border: '1px solid #f5c6c6', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#a32d2d', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '12px', background: '#2d5be3', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: loading ? 'wait' : 'pointer', fontFamily: 'sans-serif', opacity: loading ? .7 : 1 }}>
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#7a7a85' }}>
            {mode === 'signin' ? (
              <>Don't have an account?{' '}
                <button onClick={() => { setMode('signup'); setError('') }}
                  style={{ background: 'none', border: 'none', color: '#2d5be3', cursor: 'pointer', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: 500 }}>
                  Sign up
                </button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={() => { setMode('signin'); setError('') }}
                  style={{ background: 'none', border: 'none', color: '#2d5be3', cursor: 'pointer', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: 500 }}>
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '11px', color: '#b0b0b8', marginTop: '20px', lineHeight: 1.6 }}>
          By continuing you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
