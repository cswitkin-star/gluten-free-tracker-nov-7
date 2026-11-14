import { useState } from 'react'
import { DISCLAIMER_SHORT } from '../copy'
import { daysBetween, timeAgo, todayISO } from '../lib/dates'
import { FRYER_LABEL, KITCHEN_LABEL, STAFF_LABEL } from '../lib/labels'
import { STALE_DAYS } from '../match/match'
import { useApp } from '../store/useApp'
import type { FryerStatus, KitchenStatus, RestaurantSafety, StaffKnowledge } from '../types'

const FRYERS: FryerStatus[] = ['dedicated', 'shared', 'no_fryer', 'unknown']
const KITCHENS: KitchenStatus[] = ['dedicated_gf', 'separate_prep', 'shared', 'unknown']
const STAFF: StaffKnowledge[] = ['knowledgeable', 'some', 'unaware', 'unknown']

/** Safety signals, shown separately from taste. Always worded as "reported". */
export function SafetyPanel({ safety }: { safety: RestaurantSafety }) {
  const updateSafety = useApp((s) => s.updateSafety)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(safety)
  const today = todayISO()
  const stale = safety.lastConfirmed === null || daysBetween(safety.lastConfirmed, today) > STALE_DAYS

  const rows = [
    { label: 'Fryer', value: FRYER_LABEL[safety.fryer] },
    { label: 'Kitchen', value: KITCHEN_LABEL[safety.kitchen] },
    { label: 'Staff', value: STAFF_LABEL[safety.staffKnowledge] },
    { label: 'Menu', value: safety.flaggedGfFood ? 'Menu flags gluten-free items' : 'No GF flags on the menu reported' },
  ]

  return (
    <section className="card stack" aria-labelledby="safety-h">
      <div className="row spread">
        <h2 id="safety-h">Safety signals</h2>
        <span className={`badge ${stale ? 'workable' : 'plain'}`}>
          {safety.lastConfirmed ? `Confirmed ${timeAgo(safety.lastConfirmed, today)}` : 'Not confirmed yet'}
        </span>
      </div>
      <p className="muted small" style={{ margin: 0 }}>Reported by people, not guaranteed. {DISCLAIMER_SHORT}</p>

      {!editing && (
        <>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} className="stack">
            {rows.map((r) => (
              <li key={r.label} className="row spread">
                <span className="muted">{r.label}</span>
                <strong style={{ textAlign: 'right' }}>{r.value}</strong>
              </li>
            ))}
          </ul>
          {stale && <div className="notice warn">These facts are old or missing. Please double-check with the restaurant.</div>}
          <div className="row wrap">
            <button className="btn secondary" onClick={() => updateSafety(safety.restaurantId, {})}>Still accurate</button>
            <button className="btn secondary" onClick={() => { setDraft(safety); setEditing(true) }}>Something changed</button>
          </div>
        </>
      )}

      {editing && (
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault()
            updateSafety(safety.restaurantId, {
              fryer: draft.fryer, kitchen: draft.kitchen, staffKnowledge: draft.staffKnowledge, flaggedGfFood: draft.flaggedGfFood,
            })
            setEditing(false)
          }}
        >
          <label className="field"><span>Fryer</span>
            <select value={draft.fryer} onChange={(e) => setDraft({ ...draft, fryer: e.target.value as FryerStatus })}>
              {FRYERS.map((f) => <option key={f} value={f}>{FRYER_LABEL[f]}</option>)}
            </select>
          </label>
          <label className="field"><span>Kitchen</span>
            <select value={draft.kitchen} onChange={(e) => setDraft({ ...draft, kitchen: e.target.value as KitchenStatus })}>
              {KITCHENS.map((k) => <option key={k} value={k}>{KITCHEN_LABEL[k]}</option>)}
            </select>
          </label>
          <label className="field"><span>Staff</span>
            <select value={draft.staffKnowledge} onChange={(e) => setDraft({ ...draft, staffKnowledge: e.target.value as StaffKnowledge })}>
              {STAFF.map((s) => <option key={s} value={s}>{STAFF_LABEL[s]}</option>)}
            </select>
          </label>
          <label className="choice">
            <input type="checkbox" checked={draft.flaggedGfFood} onChange={(e) => setDraft({ ...draft, flaggedGfFood: e.target.checked })} />
            <span><strong>Menu flags gluten-free items</strong></span>
          </label>
          <div className="row">
            <button type="submit" className="btn">Save and confirm today</button>
            <button type="button" className="btn secondary" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      )}
    </section>
  )
}
