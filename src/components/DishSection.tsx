import { useState } from 'react'
import { daysBetween, timeAgo, todayISO } from '../lib/dates'
import { ALLERGEN_LABEL, GF_STATUS_LABEL } from '../lib/labels'
import { STALE_DAYS } from '../match/match'
import { useApp } from '../store/useApp'
import type { Allergen, Dish, GFStatus } from '../types'

const STATUSES: GFStatus[] = ['gf_as_served', 'can_be_gf', 'not_gf']
const ALLERGENS: Allergen[] = ['dairy', 'nuts', 'soy']
const STATUS_BADGE: Record<GFStatus, string> = { gf_as_served: 'great', can_be_gf: 'workable', not_gf: 'skip' }

interface FormValue {
  name: string
  gfStatus: GFStatus
  modificationNote: string
  fried: boolean
  allergens: Allergen[]
}

function DishForm({ initial, onSave, onCancel }: { initial: FormValue; onSave: (v: FormValue) => void; onCancel: () => void }) {
  const [v, setV] = useState(initial)
  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); if (v.name.trim()) onSave({ ...v, name: v.name.trim() }) }}>
      <label className="field"><span>Dish name</span>
        <input type="text" required value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
      </label>
      <label className="field"><span>Gluten-free status</span>
        <select value={v.gfStatus} onChange={(e) => setV({ ...v, gfStatus: e.target.value as GFStatus })}>
          {STATUSES.map((s) => <option key={s} value={s}>{GF_STATUS_LABEL[s]}</option>)}
        </select>
      </label>
      <label className="field"><span>What to ask for</span>
        <input type="text" placeholder="e.g. no soy sauce, ask for tamari" value={v.modificationNote} onChange={(e) => setV({ ...v, modificationNote: e.target.value })} />
      </label>
      <label className="choice">
        <input type="checkbox" checked={v.fried} onChange={(e) => setV({ ...v, fried: e.target.checked })} />
        <span><strong>It is fried</strong></span>
      </label>
      <div className="row wrap" role="group" aria-label="Contains">
        {ALLERGENS.map((a) => (
          <button key={a} type="button" className="chip" aria-pressed={v.allergens.includes(a)}
            onClick={() => setV({ ...v, allergens: v.allergens.includes(a) ? v.allergens.filter((x) => x !== a) : [...v.allergens, a] })}>
            Contains {ALLERGEN_LABEL[a].toLowerCase()}
          </button>
        ))}
      </div>
      <div className="row">
        <button type="submit" className="btn">Save</button>
        <button type="button" className="btn secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}

function DishRow({ dish }: { dish: Dish }) {
  const confirmDish = useApp((s) => s.confirmDish)
  const upsertDish = useApp((s) => s.upsertDish)
  const [editing, setEditing] = useState(false)
  const today = todayISO()
  const old = daysBetween(dish.lastConfirmed, today) > STALE_DAYS

  if (editing) {
    return (
      <li className="card">
        <DishForm
          initial={dish}
          onCancel={() => setEditing(false)}
          onSave={(v) => { upsertDish({ ...v, id: dish.id, restaurantId: dish.restaurantId }); setEditing(false) }}
        />
      </li>
    )
  }
  return (
    <li className="card stack">
      <div className="row spread" style={{ alignItems: 'flex-start' }}>
        <strong>{dish.name}</strong>
        <span className={`badge ${STATUS_BADGE[dish.gfStatus]}`}>{GF_STATUS_LABEL[dish.gfStatus]}</span>
      </div>
      {dish.modificationNote && <p style={{ margin: 0 }}><strong>Ask:</strong> {dish.modificationNote}</p>}
      <div className="row wrap">
        {dish.fried && <span className="badge plain">Fried</span>}
        {dish.allergens.map((a) => <span key={a} className="badge plain">Contains {ALLERGEN_LABEL[a].toLowerCase()}</span>)}
        {dish.source === 'user' && <span className="badge info">You edited this</span>}
      </div>
      <div className="row spread wrap">
        <span className={`small ${old ? '' : 'muted'}`}>{old ? '⚠ ' : ''}Confirmed {timeAgo(dish.lastConfirmed, today)}</span>
        <span className="row">
          <button className="chip" onClick={() => confirmDish(dish)}>Still right</button>
          <button className="chip" onClick={() => setEditing(true)}>Correct</button>
        </span>
      </div>
    </li>
  )
}

export function DishSection({ restaurantId, dishes }: { restaurantId: string; dishes: Dish[] }) {
  const upsertDish = useApp((s) => s.upsertDish)
  const [adding, setAdding] = useState(false)
  const order: Record<GFStatus, number> = { gf_as_served: 0, can_be_gf: 1, not_gf: 2 }
  const sorted = [...dishes].sort((a, b) => order[a.gfStatus] - order[b.gfStatus] || a.name.localeCompare(b.name))

  return (
    <section className="stack" aria-labelledby="dishes-h">
      <h2 id="dishes-h">Dishes</h2>
      {sorted.length === 0 && (
        <div className="empty card">
          <div className="big" aria-hidden>🥗</div>
          <p>No dishes reported yet. Been here? Add what you ate and how it was ordered.</p>
        </div>
      )}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} className="stack">
        {sorted.map((d) => <DishRow key={d.id} dish={d} />)}
      </ul>
      {adding ? (
        <div className="card">
          <h3>Add a dish</h3>
          <DishForm
            initial={{ name: '', gfStatus: 'can_be_gf', modificationNote: '', fried: false, allergens: [] }}
            onCancel={() => setAdding(false)}
            onSave={(v) => { upsertDish({ ...v, restaurantId }); setAdding(false) }}
          />
        </div>
      ) : (
        <button className="btn secondary block" onClick={() => setAdding(true)}>+ Add a dish or tag</button>
      )}
    </section>
  )
}
