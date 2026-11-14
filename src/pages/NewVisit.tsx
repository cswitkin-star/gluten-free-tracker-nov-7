import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { GifPicker } from '../components/GifPicker'
import { VisitPhotoPicker } from '../components/VisitPhotoPicker'
import { todayISO } from '../lib/dates'
import { FRYER_LABEL, KITCHEN_LABEL, OUTCOME_LABEL, STAFF_LABEL } from '../lib/labels'
import { addVisitPhoto } from '../photos/visitPhotos'
import { useApp } from '../store/useApp'
import { useAuth } from '../store/useAuth'
import { useData } from '../store/useCatalog'
import type { Gif, Outcome } from '../types'

const OUTCOMES: Outcome[] = ['fine', 'mild', 'glutened']

export default function NewVisit() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const { data } = useData()
  const addVisit = useApp((s) => s.addVisit)
  const updateSafety = useApp((s) => s.updateSafety)

  const [restaurantId, setRestaurantId] = useState(params.get('r') ?? '')
  const [picked, setPicked] = useState<string[]>([])
  const [other, setOther] = useState('')
  const [outcome, setOutcome] = useState<Outcome>('fine')
  const [date, setDate] = useState(todayISO())
  const [notes, setNotes] = useState('')
  const [doneFor, setDoneFor] = useState<string | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [gif, setGif] = useState<Gif | null>(null)
  const [saving, setSaving] = useState('')
  const [failedUploads, setFailedUploads] = useState(0)
  const userId = useAuth((s) => s.user?.id ?? null)

  const dishes = restaurantId ? data.getDishes(restaurantId) : []

  // Step 2: "Still accurate?" prompt after the visit is saved.
  if (doneFor) {
    const r = data.getRestaurant(doneFor)
    const s = data.getSafety(doneFor)
    return (
      <div className="stack">
        <h1>Visit saved</h1>
        <div className="card stack">
          <h2>Still accurate?</h2>
          <p className="muted" style={{ margin: 0 }}>Here is what we have for {r?.name}. Does it match what you saw?</p>
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            <li>{FRYER_LABEL[s.fryer]}</li>
            <li>{KITCHEN_LABEL[s.kitchen]}</li>
            <li>{STAFF_LABEL[s.staffKnowledge]}</li>
          </ul>
          <div className="row wrap">
            <button className="btn" onClick={() => { updateSafety(doneFor, {}); nav('/log') }}>Yes, still accurate</button>
            <Link className="btn secondary" to={`/restaurant/${doneFor}`}>Something changed</Link>
          </div>
          {failedUploads > 0 && (
            <div className="notice warn" role="alert">
              {failedUploads === 1 ? '1 photo' : `${failedUploads} photos`} could not upload. Your visit is saved. You can add photos again from My list.
            </div>
          )}
          <button className="chip" onClick={() => nav('/log')}>Skip for now</button>
        </div>
      </div>
    )
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restaurantId || saving) return
    const extra = other.split(',').map((x) => x.trim()).filter(Boolean)
    // The visit is saved first, so it is never lost if a photo fails to upload.
    const visit = addVisit({ restaurantId, dishesOrdered: [...picked, ...extra], outcome, notes: notes.trim(), date, gif: gif ?? undefined })
    let failed = 0
    if (userId && files.length) {
      for (let i = 0; i < files.length; i++) {
        setSaving(`Uploading photo ${i + 1} of ${files.length}…`)
        try {
          await addVisitPhoto(userId, files[i], visit.id, restaurantId)
        } catch (err) {
          console.error('Photo upload failed:', err)
          failed++
        }
      }
    }
    setSaving('')
    setFailedUploads(failed)
    setDoneFor(restaurantId)
  }

  return (
    <form className="stack" onSubmit={submit}>
      <Link to="/log" className="small">← Back</Link>
      <h1>Log a visit</h1>

      <label className="field"><span>Where did you eat?</span>
        <select required value={restaurantId} onChange={(e) => { setRestaurantId(e.target.value); setPicked([]) }}>
          <option value="">Choose a restaurant</option>
          {data.restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </label>

      {dishes.length > 0 && (
        <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="stack">
          <legend style={{ fontWeight: 600, marginBottom: 6 }}>What did you order?</legend>
          {dishes.map((d) => (
            <label key={d.id} className="choice">
              <input type="checkbox" checked={picked.includes(d.name)}
                onChange={(e) => setPicked(e.target.checked ? [...picked, d.name] : picked.filter((x) => x !== d.name))} />
              <span><strong>{d.name}</strong></span>
            </label>
          ))}
        </fieldset>
      )}
      <label className="field"><span>Anything else? (comma separated)</span>
        <input type="text" value={other} onChange={(e) => setOther(e.target.value)} />
      </label>

      <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="stack">
        <legend style={{ fontWeight: 600, marginBottom: 6 }}>How did you feel afterward?</legend>
        {OUTCOMES.map((o) => (
          <label key={o} className="choice">
            <input type="radio" name="outcome" checked={outcome === o} onChange={() => setOutcome(o)} />
            <span><strong>{OUTCOME_LABEL[o]}</strong></span>
          </label>
        ))}
      </fieldset>

      <label className="field"><span>Date</span>
        <input type="text" inputMode="numeric" pattern="\d{4}-\d{2}-\d{2}" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <label className="field"><span>Notes (optional)</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>

      <VisitPhotoPicker files={files} onChange={setFiles} disabled={!!saving} />
      <GifPicker gif={gif} onChange={setGif} />

      <div className="sticky-actions">
        <button className="btn block" type="submit" disabled={!restaurantId || !!saving} aria-live="polite">
          {saving || 'Save visit'}
        </button>
      </div>
    </form>
  )
}
