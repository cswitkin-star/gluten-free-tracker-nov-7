import { ALLERGEN_LABEL, TOLERANCE_DESC, TOLERANCE_LABEL } from '../lib/labels'
import { useApp } from '../store/useApp'
import type { Allergen, Tolerance } from '../types'

const TOLERANCES: Tolerance[] = ['celiac', 'sensitive', 'preference']
const ALLERGENS: Allergen[] = ['dairy', 'nuts', 'soy']

export function ToleranceChoices() {
  const tolerance = useApp((s) => s.profile.tolerance)
  const setProfile = useApp((s) => s.setProfile)
  return (
    <div className="stack" role="radiogroup" aria-label="Gluten tolerance">
      {TOLERANCES.map((t) => (
        <label key={t} className="choice">
          <input type="radio" name="tolerance" checked={tolerance === t} onChange={() => setProfile({ tolerance: t })} />
          <span>
            <strong>{TOLERANCE_LABEL[t]}</strong>
            <span className="muted">{TOLERANCE_DESC[t]}</span>
          </span>
        </label>
      ))}
    </div>
  )
}

export function PreferenceToggles() {
  const p = useApp((s) => s.profile)
  const setProfile = useApp((s) => s.setProfile)
  const rows = [
    { key: 'needsDedicatedFryer', title: 'Dedicated fryer', desc: 'Fried food should come from a fryer with no gluten.' },
    { key: 'needsSeparatePrep', title: 'Separate prep area', desc: 'A clean, separate space for gluten-free cooking.' },
    { key: 'wantsGfBeer', title: 'Gluten-free beer', desc: 'Nice to have on the menu.' },
    { key: 'wantsGfDesserts', title: 'Gluten-free desserts', desc: 'Nice to have on the menu.' },
  ] as const
  return (
    <div className="stack">
      {rows.map((r) => (
        <label key={r.key} className="choice">
          <input type="checkbox" checked={p[r.key]} onChange={(e) => setProfile({ [r.key]: e.target.checked })} />
          <span>
            <strong>{r.title}</strong>
            <span className="muted">{r.desc}</span>
          </span>
        </label>
      ))}
    </div>
  )
}

export function AllergyToggles() {
  const allergies = useApp((s) => s.profile.allergies)
  const setProfile = useApp((s) => s.setProfile)
  const toggle = (a: Allergen) =>
    setProfile({ allergies: allergies.includes(a) ? allergies.filter((x) => x !== a) : [...allergies, a] })
  return (
    <div className="row wrap" role="group" aria-label="Other allergies">
      {ALLERGENS.map((a) => (
        <button key={a} type="button" className="chip" aria-pressed={allergies.includes(a)} onClick={() => toggle(a)}>
          {ALLERGEN_LABEL[a]}
        </button>
      ))}
    </div>
  )
}
