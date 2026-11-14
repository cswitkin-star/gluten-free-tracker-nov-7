import type { User } from '@supabase/supabase-js'
import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error'

interface AuthState {
  user: User | null
  /** False until we know whether someone is already signed in. */
  ready: boolean
  syncStatus: SyncStatus
  init: () => () => void
  signUp: (email: string, password: string) => Promise<{ ok: boolean; message: string }>
  signIn: (email: string, password: string) => Promise<{ ok: boolean; message: string }>
}

/** Turns Supabase errors into short, plain messages. We never reveal whether an email is registered. */
function friendly(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login')) return 'That email and password do not match.'
  if (m.includes('email not confirmed')) return 'Please confirm your email first. Check your inbox.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Too many tries. Wait a minute and try again.'
  if (m.includes('password')) return 'Use a password with at least 8 characters.'
  if (m.includes('valid email') || m.includes('invalid email')) return 'Enter a valid email address.'
  return 'Something went wrong. Please try again.'
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  ready: !supabase,
  syncStatus: 'idle',

  init: () => {
    if (!supabase) return () => {}
    void supabase.auth.getSession().then(({ data }) => set({ user: data.session?.user ?? null, ready: true }))
    const { data } = supabase.auth.onAuthStateChange((_event, session) => set({ user: session?.user ?? null, ready: true }))
    return () => data.subscription.unsubscribe()
  },

  signUp: async (email, password) => {
    if (!supabase) return { ok: false, message: 'Accounts are not available right now.' }
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
    if (error) return { ok: false, message: friendly(error.message) }
    // With email confirmation on, there is no session until the link is clicked.
    if (!data.session) return { ok: true, message: 'Check your email to confirm your account, then sign in.' }
    return { ok: true, message: 'Account created.' }
  },

  signIn: async (email, password) => {
    if (!supabase) return { ok: false, message: 'Accounts are not available right now.' }
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    return error ? { ok: false, message: friendly(error.message) } : { ok: true, message: 'Signed in.' }
  },
}))
