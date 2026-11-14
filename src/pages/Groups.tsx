import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MatchBadge } from '../components/MatchBadge'
import { toShareOption } from '../group/share'
import { buildShortlist, type GroupConstraints, type ShortlistItem } from '../group/shortlist'
import { PRICE_LABEL, TOLERANCE_LABEL } from '../lib/labels'
import { todayISO } from '../lib/dates'
import { useApp } from '../store/useApp'
import { useData } from '../store/useCatalog'
import { useGroups } from '../store/useGroups'
import type { Price, Tolerance } from '../types'

export default function Groups() {
  const { data } = useData()
  const profile = useApp((s) => s.profile)
  const groups = useGroups((s) => s.groups)
  const addGroup = useGroups((s) => s.addGroup)
  const nav = useNavigate()

  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [c, setC] = useState<GroupConstraints>({ size: 4, cuisines: [], maxPrice: 3, neighborhood: '', openNow: false, tolerance: profile.tolerance })
  const [results, setResults] = useState<ShortlistItem[] | null>(null)
  const [chosen, setChosen] = useState<string[]>([])

  const cuisines = useMemo(() => [...new Set(data.restaurants.map((r) => r.cuisine))].sort(), [data])
  const hoods = useMemo(() => [...new Set(data.restaurants.map((r) => r.neighborhood))].sort(), [data])

  const build = () => {
    const candidates = data.restaurants.map((restaurant) => ({
      restaurant, safety: data.getSafety(restaurant.id), dishes: data.getDishes(restaurant.id),
    }))
    const list = buildShortlist(candidates, profile, c)
    setResults(list)
    setChosen(list.map((i) => i.restaurant.id))
  }

  const create = () => {
    if (!results) return
    const options = results.filter((i) => chosen.includes(i.restaurant.id)).map((i) => toShareOption(i.restaurant))
    if (options.length === 0) return
    const id = `g${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
    addGroup({ id, title: title.trim() || 'Group dinner', size: c.size, createdAt: todayISO(), options })
    nav(`/groups/${id}`)
  }

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  if (!creating) {
    return (
      <div className="stack">
        <h1>Group dinners</h1>
        <p className="muted" style={{ margin: 0 }}>Find a place that works for everyone, then share a link so friends can vote. They do not need the app.</p>
        <button className="btn block" onClick={() => setCreating(true)}>+ Plan a group dinner</button>
        {groups.length === 0 ? (
          <div className="empty card"><div className="big" aria-hidden>🍽️</div><p>No groups yet.</p></div>
        ) : (
          groups.map((g) => (
            <Link key={g.id} className="card" to={`/groups/${g.id}`}>
              <strong>{g.title}</strong>
              <div className="muted small">{g.options.length} options · {Object.keys(g.votes).length} voted · party of {g.size}</div>
            </Link>
          ))
        )}
      </div>
    )
  }

  return (
    <div className="stack">
      <button className="chip" onClick={() => { setCreating(false); setResults(null) }}>← Cancel</button>
      <h1>Plan a group dinner</h1>

      <label className="field"><span>What is it for?</span>
        <input type="text" placeholder="Friday dinner" value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>

      <div className="row spread card">
        <strong id="size-l">Group size</strong>
        <span className="row" role="group" aria-labelledby="size-l">
          <button className="chip" aria-label="Fewer people" onClick={() => setC({ ...c, size: Math.max(2, c.size - 1) })}>−</button>
          <strong style={{ minWidth: 28, textAlign: 'center' }}>{c.size}</strong>
          <button className="chip" aria-label="More people" onClick={() => setC({ ...c, size: Math.min(20, c.size + 1) })}>+</button>
        </span>
      </div>
      {c.size >= 6 && <div className="notice">Big group: call ahead to book a table.</div>}

      <div className="stack">
        <strong>Gluten-free eater’s tolerance</strong>
        <div className="seg">
          {(['celiac', 'sensitive', 'preference'] as Tolerance[]).map((t) => (
            <button key={t} className="chip" aria-pressed={c.tolerance === t} onClick={() => setC({ ...c, tolerance: t })}>{TOLERANCE_LABEL[t]}</button>
          ))}
        </div>
      </div>

      <div className="stack">
        <strong>Cuisine (any if none picked)</strong>
        <div className="row wrap">
          {cuisines.map((x) => <button key={x} className="chip" aria-pressed={c.cuisines.includes(x)} onClick={() => setC({ ...c, cuisines: toggle(c.cuisines, x) })}>{x}</button>)}
        </div>
      </div>

      <div className="stack">
        <strong>Up to</strong>
        <div className="seg">
          {([1, 2, 3, 4] as Price[]).map((p) => <button key={p} className="chip" aria-pressed={c.maxPrice === p} aria-label={`Up to ${PRICE_LABEL(p)}`} onClick={() => setC({ ...c, maxPrice: p })}>{PRICE_LABEL(p)}</button>)}
        </div>
      </div>

      <label className="field"><span>Neighborhood</span>
        <select value={c.neighborhood} onChange={(e) => setC({ ...c, neighborhood: e.target.value })}>
          <option value="">Anywhere in NYC</option>
          {hoods.map((h) => <option key={h}>{h}</option>)}
        </select>
      </label>
      <button className="chip" aria-pressed={c.openNow} onClick={() => setC({ ...c, openNow: !c.openNow })}>Open now</button>

      <button className="btn block" onClick={build}>Build shortlist</button>

      {results && (
        <section className="stack" aria-label="Shortlist" aria-live="polite">
          <h2>Shortlist</h2>
          {results.length === 0 ? (
            <div className="empty card"><p>Nothing fits all of that. Try a higher price or fewer cuisines.</p></div>
          ) : (
            <>
              <p className="muted small" style={{ margin: 0 }}>Uncheck any you do not want to send.</p>
              {results.map((i) => (
                <label key={i.restaurant.id} className="choice">
                  <input type="checkbox" checked={chosen.includes(i.restaurant.id)} onChange={() => setChosen(toggle(chosen, i.restaurant.id))} />
                  <span style={{ flex: 1 }}>
                    <strong>{i.restaurant.name}</strong>
                    <span className="muted small">{i.restaurant.cuisine} · {PRICE_LABEL(i.restaurant.price)} · {i.restaurant.neighborhood}</span>
                    <span style={{ display: 'block', marginTop: 4 }}><MatchBadge label={i.match.label} /> <span className="small">{i.match.reason}</span></span>
                  </span>
                </label>
              ))}
              <button className="btn block" disabled={chosen.length === 0} onClick={create}>Create group and get link</button>
            </>
          )}
        </section>
      )}
    </div>
  )
}
