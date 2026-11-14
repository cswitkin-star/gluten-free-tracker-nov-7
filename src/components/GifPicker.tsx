import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { GIF_ERROR_TEXT, GifError, searchGifs, type GifErrorCode } from '../gifs/giphy'
import { supabaseConfigured } from '../lib/supabase'
import { useAuth } from '../store/useAuth'
import type { Gif } from '../types'

/** Search GIPHY and attach one GIF to a visit. Searches go through our own server function. */
export function GifPicker({ gif, onChange }: { gif: Gif | null; onChange: (g: Gif | null) => void }) {
  const signedIn = useAuth((s) => !!s.user)
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Gif[]>([])
  const [loading, setLoading] = useState(false)
  const [more, setMore] = useState(false)
  const [error, setError] = useState<GifErrorCode | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latest = useRef(0) // ignores answers that arrive after a newer search

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  if (!supabaseConfigured) return null

  const run = async (query: string, offset: number) => {
    const id = ++latest.current
    setLoading(true)
    setError(null)
    try {
      const gifs = await searchGifs(query, offset)
      if (id !== latest.current) return
      setResults((cur) => (offset === 0 ? gifs : [...cur, ...gifs]))
      setMore(gifs.length >= 12 && offset < 180)
    } catch (e) {
      if (id !== latest.current) return
      console.error('GIF search error:', e)
      setError(e instanceof GifError ? e.code : 'failed')
    } finally {
      if (id === latest.current) setLoading(false)
    }
  }

  const openPanel = () => {
    setOpen(true)
    if (!results.length) void run('', 0) // trending to start
  }

  const onQuery = (value: string) => {
    setQ(value)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => void run(value, 0), 350)
  }

  if (gif) {
    return (
      <div className="stack">
        <strong>Your GIF</strong>
        <img src={gif.url} alt={gif.title} width={gif.width} height={gif.height} style={{ maxWidth: '100%', height: 'auto', borderRadius: 12 }} />
        <div className="row spread">
          <span className="muted small">Powered by GIPHY</span>
          <button type="button" className="chip" onClick={() => onChange(null)}>Remove GIF</button>
        </div>
      </div>
    )
  }

  if (!signedIn) {
    return <p className="muted small" style={{ margin: 0 }}><Link to="/profile">Sign in</Link> to add GIFs and photos to your visits.</p>
  }

  if (!open) {
    return <button type="button" className="btn secondary" onClick={openPanel}>🎞️ Add a GIF</button>
  }

  return (
    <div className="card stack" aria-label="GIF search">
      <label className="field"><span>Search GIFs</span>
        <input type="search" placeholder="Try “happy dance” or “pizza”" maxLength={50} value={q} onChange={(e) => onQuery(e.target.value)} />
      </label>
      {error && <div className="notice warn" role="alert">{GIF_ERROR_TEXT[error]}</div>}
      {loading && results.length === 0 && <p className="muted" aria-live="polite">Loading…</p>}
      {!loading && !error && results.length === 0 && <p className="muted">No GIFs found. Try another word.</p>}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        {results.map((g) => (
          <li key={g.id}>
            <button
              type="button"
              aria-label={`Add GIF: ${g.title}`}
              onClick={() => { onChange(g); setOpen(false) }}
              style={{ padding: 0, border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', background: 'var(--bg)', width: '100%', cursor: 'pointer', minHeight: 'var(--tap)' }}
            >
              <img src={g.previewUrl} alt="" loading="lazy" style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }} />
            </button>
          </li>
        ))}
      </ul>
      <div className="row spread wrap">
        <span className="muted small">Powered by GIPHY</span>
        <span className="row">
          {more && <button type="button" className="chip" disabled={loading} onClick={() => void run(q, results.length)}>{loading ? 'Loading…' : 'More'}</button>}
          <button type="button" className="chip" onClick={() => setOpen(false)}>Close</button>
        </span>
      </div>
    </div>
  )
}
