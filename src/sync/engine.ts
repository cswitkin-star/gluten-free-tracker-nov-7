import { supabase } from '../lib/supabase'
import { useApp } from '../store/useApp'
import { useAuth } from '../store/useAuth'
import { useGroups } from '../store/useGroups'
import { isUserData, mergeUserData, type UserData } from './userData'

// Remembers which account this device last synced with. If it matches, the account's
// copy wins on load (so deletions made on another device stick). If not, we merge.
const MARKER = 'gf-sync-user'
const PUSH_DELAY_MS = 800

const getMarker = () => { try { return localStorage.getItem(MARKER) } catch { return null } }
const setMarker = (id: string | null) => {
  try {
    if (id) localStorage.setItem(MARKER, id)
    else localStorage.removeItem(MARKER)
  } catch {
    /* storage unavailable */
  }
}

export function snapshot(): UserData {
  const a = useApp.getState()
  return {
    v: 1,
    profile: a.profile,
    saved: a.saved,
    visits: a.visits,
    userDishes: a.userDishes,
    safetyOverrides: a.safetyOverrides,
    userReviews: a.userReviews,
    groups: useGroups.getState().groups,
  }
}

let applying = false
let pulled = false
let timer: ReturnType<typeof setTimeout> | null = null

function apply(d: UserData) {
  applying = true
  useApp.setState({
    profile: d.profile, saved: d.saved, visits: d.visits, userDishes: d.userDishes,
    safetyOverrides: d.safetyOverrides, userReviews: d.userReviews,
  })
  useGroups.setState({ groups: d.groups })
  applying = false
}

const setStatus = (s: 'idle' | 'syncing' | 'synced' | 'error') => useAuth.setState({ syncStatus: s })

/** Writes the current local data to the signed-in user's row. */
export async function pushNow(): Promise<boolean> {
  if (timer) { clearTimeout(timer); timer = null }
  const user = useAuth.getState().user
  if (!supabase || !user || !pulled) return false
  setStatus('syncing')
  const { error } = await supabase
    .from('user_data')
    .upsert({ user_id: user.id, data: snapshot(), updated_at: new Date().toISOString() })
  setStatus(error ? 'error' : 'synced')
  if (!error) setMarker(user.id)
  return !error
}

function schedulePush() {
  if (applying) return
  const { user, ready } = useAuth.getState()
  if (!user) {
    // Edits made while signed out must be merged (not overwritten) at the next sign-in.
    if (ready) setMarker(null)
    return
  }
  if (!pulled) return
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => void pushNow(), PUSH_DELAY_MS)
}

async function pull(userId: string) {
  if (!supabase) return
  pulled = false
  setStatus('syncing')
  const { data, error } = await supabase.from('user_data').select('data').eq('user_id', userId).maybeSingle()
  // Ignore a late answer if someone signed out or switched accounts meanwhile.
  if (useAuth.getState().user?.id !== userId) return
  if (error) return setStatus('error')
  const remote = isUserData(data?.data) ? data.data : null
  const merged = getMarker() === userId && remote ? remote : mergeUserData(snapshot(), remote)
  apply(merged)
  pulled = true
  await pushNow()
}

/** Wires auth, pulls on sign-in, and pushes (debounced) after every local change. Returns a cleanup. */
export function startSync(): () => void {
  const stopAuth = useAuth.getState().init()
  const unsubUser = useAuth.subscribe((s, prev) => {
    if (s.user?.id === prev.user?.id) return
    pulled = false
    if (s.user) void pull(s.user.id)
    else setStatus('idle')
  })
  const unsubApp = useApp.subscribe(schedulePush)
  const unsubGroups = useGroups.subscribe(schedulePush)
  return () => { stopAuth(); unsubUser(); unsubApp(); unsubGroups(); if (timer) clearTimeout(timer) }
}

/** Saves any pending edits, signs out, and clears this device so the next person starts fresh. */
export async function signOutAndClear(): Promise<{ ok: boolean; message: string }> {
  if (!supabase) return { ok: false, message: 'Accounts are not available right now.' }
  // Never wipe this device unless the latest changes are safely in the account.
  if (!(await pushNow())) {
    return { ok: false, message: 'Could not save your latest changes. Check your connection and try again.' }
  }
  await supabase.auth.signOut()
  pulled = false
  applying = true
  useApp.getState().resetAll()
  useGroups.setState({ groups: [] })
  applying = false
  setMarker(null)
  setStatus('idle')
  return { ok: true, message: 'Signed out.' }
}
