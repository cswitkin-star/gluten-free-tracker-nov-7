import { useState } from 'react'
import { supabaseConfigured } from '../lib/supabase'
import { pushNow, signOutAndClear } from '../sync/engine'
import { useAuth } from '../store/useAuth'

const STATUS_TEXT = {
  idle: '',
  syncing: 'Saving…',
  synced: 'Saved to your account',
  error: 'Could not save. We will retry when you make a change.',
} as const

export function AccountPanel() {
  const user = useAuth((s) => s.user)
  const ready = useAuth((s) => s.ready)
  const status = useAuth((s) => s.syncStatus)
  const signIn = useAuth((s) => s.signIn)
  const signUp = useAuth((s) => s.signUp)

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  if (!supabaseConfigured) {
    return <div className="notice">Accounts are not set up on this copy of the app. Your data stays in this browser.</div>
  }
  if (!ready) return <p className="muted">Checking your account…</p>

  if (user) {
    return (
      <div className="card stack">
        <div>
          <strong>Signed in</strong>
          <div className="muted small" style={{ overflowWrap: 'anywhere' }}>{user.email}</div>
        </div>
        <p className="muted small" style={{ margin: 0 }} aria-live="polite">
          Your profile, saved places, visits and edits are kept in your account so they follow you to other devices.
          {STATUS_TEXT[status] && <><br /><strong>{STATUS_TEXT[status]}</strong></>}
        </p>
        {status === 'error' && <button className="btn secondary" onClick={() => void pushNow()}>Try again</button>}
        <button
          className="btn secondary"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            const r = await signOutAndClear()
            setBusy(false)
            setMsg({ ok: r.ok, text: r.message })
          }}
        >
          Sign out
        </button>
        <p className="muted small" style={{ margin: 0 }}>Signing out clears this device. Your data stays in your account.</p>
        {msg && !msg.ok && <div className="notice warn" role="alert">{msg.text}</div>}
      </div>
    )
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) return setMsg({ ok: false, text: 'Use a password with at least 8 characters.' })
    setBusy(true)
    setMsg(null)
    const r = mode === 'signin' ? await signIn(email, password) : await signUp(email, password)
    setBusy(false)
    setMsg({ ok: r.ok, text: r.message })
    if (r.ok) setPassword('')
  }

  return (
    <form className="card stack" onSubmit={submit}>
      <div className="seg" role="group" aria-label="Sign in or create account">
        <button type="button" className="chip" aria-pressed={mode === 'signin'} onClick={() => { setMode('signin'); setMsg(null) }}>Sign in</button>
        <button type="button" className="chip" aria-pressed={mode === 'signup'} onClick={() => { setMode('signup'); setMsg(null) }}>Create account</button>
      </div>
      <p className="muted small" style={{ margin: 0 }}>
        Optional. An account saves your profile, safe list and log so they follow you to other devices.
      </p>
      <label className="field"><span>Email</span>
        <input type="email" required autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="field"><span>Password</span>
        <input type="password" required minLength={8} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <button className="btn" type="submit" disabled={busy || !email || !password}>
        {busy ? 'One moment…' : mode === 'signin' ? 'Sign in' : 'Create account'}
      </button>
      {msg && <div className={`notice ${msg.ok ? '' : 'warn'}`} role="status">{msg.text}</div>}
    </form>
  )
}
