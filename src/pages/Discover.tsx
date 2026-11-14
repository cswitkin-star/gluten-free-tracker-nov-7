import { useMemo, useState } from 'react'
import { MapView } from '../components/MapView'
import { RestaurantCard } from '../components/RestaurantCard'
import { SAMPLE_DATA_NOTICE } from '../copy'
import { isOpenAt, nycHourNow } from '../lib/dates'
import { TOLERANCE_LABEL } from '../lib/labels'
import { LABEL_RANK } from '../match/match'
import { useMatches } from '../match/useMatches'
import { useApp } from '../store/useApp'
import type { Price } from '../types'

export default function Discover() {
  const { ready, items } = useMatches()
  const tolerance = useApp((s) => s.profile.tolerance)
  const [q, setQ] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [hood, setHood] = useState('')
  const [prices, setPrices] = useState<Price[]>([])
  const [openNow, setOpenNow] = useState(false)
  const [hideSkips, setHideSkips] = useState(false)
  const [showMap, setShowMap] = useState(true)

  const cuisines = useMemo(() => [...new Set(items.map((i) => i.restaurant.cuisine))].sort(), [items])
  const hoods = useMemo(() => [...new Set(items.map((i) => i.restaurant.neighborhood))].sort(), [items])

  const filtered = useMemo(() => {
    const hour = nycHourNow()
    const needle = q.trim().toLowerCase()
    return items
      .filter(({ restaurant: r, match }) => {
        if (needle && !`${r.name} ${r.neighborhood} ${r.cuisine}`.toLowerCase().includes(needle)) return false
        if (cuisine && r.cuisine !== cuisine) return false
        if (hood && r.neighborhood !== hood) return false
        if (prices.length && !prices.includes(r.price)) return false
        if (openNow && !isOpenAt(r.hours, hour)) return false
        if (hideSkips && match.label === 'skip') return false
        return true
      })
      .sort((a, b) => LABEL_RANK[a.match.label] - LABEL_RANK[b.match.label] || a.restaurant.name.localeCompare(b.restaurant.name))
  }, [items, q, cuisine, hood, prices, openNow, hideSkips])

  const togglePrice = (p: Price) => setPrices((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]))

  if (!ready) return <p className="muted">Loading…</p>

  return (
    <div className="stack">
      <div>
        <h1>Find a spot</h1>
        <p className="muted" style={{ margin: 0 }}>
          Matched for you: <strong>{TOLERANCE_LABEL[tolerance]}</strong>
        </p>
      </div>

      <label className="field">
        <span className="small muted">Search</span>
        <input type="search" placeholder="Name, neighborhood or cuisine" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>

      <div className="seg" role="group" aria-label="Quick filters">
        <button className="chip" aria-pressed={openNow} onClick={() => setOpenNow(!openNow)}>Open now</button>
        <button className="chip" aria-pressed={hideSkips} onClick={() => setHideSkips(!hideSkips)}>Hide skips</button>
        {([1, 2, 3, 4] as Price[]).map((p) => (
          <button key={p} className="chip" aria-pressed={prices.includes(p)} aria-label={`Price ${'$'.repeat(p)}`} onClick={() => togglePrice(p)}>
            {'$'.repeat(p)}
          </button>
        ))}
      </div>

      <div className="row">
        <label className="field" style={{ flex: 1 }}>
          <span className="small muted">Cuisine</span>
          <select value={cuisine} onChange={(e) => setCuisine(e.target.value)}>
            <option value="">Any</option>
            {cuisines.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="field" style={{ flex: 1 }}>
          <span className="small muted">Neighborhood</span>
          <select value={hood} onChange={(e) => setHood(e.target.value)}>
            <option value="">Any</option>
            {hoods.map((h) => <option key={h}>{h}</option>)}
          </select>
        </label>
      </div>

      <div className="row spread">
        <span className="muted small" aria-live="polite">{filtered.length} places</span>
        <button className="chip" aria-pressed={showMap} onClick={() => setShowMap(!showMap)}>{showMap ? 'Hide map' : 'Show map'}</button>
      </div>

      {showMap && <MapView items={filtered} />}

      {filtered.length === 0 ? (
        <div className="empty">
          <div className="big" aria-hidden>🍽️</div>
          <p>No places match those filters.</p>
          <button
            className="btn secondary"
            onClick={() => { setQ(''); setCuisine(''); setHood(''); setPrices([]); setOpenNow(false); setHideSkips(false) }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        filtered.map((item) => <RestaurantCard key={item.restaurant.id} item={item} />)
      )}

      <div className="notice">{SAMPLE_DATA_NOTICE}</div>
    </div>
  )
}
