import { useState } from 'react'
import { TOLERANCE_LABEL } from '../lib/labels'
import { useApp } from '../store/useApp'
import type { Review, Tolerance } from '../types'

const Stars = ({ n }: { n: number }) => (
  <span aria-label={`${n} out of 5`}>{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>
)

const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null)

function RatingPicker({ label, value, onChange, optional }: { label: string; value: number | null; onChange: (n: number | null) => void; optional?: boolean }) {
  return (
    <div role="group" aria-label={label}>
      <span className="small" style={{ fontWeight: 600 }}>{label}{optional ? ' (optional)' : ''}</span>
      <div className="row wrap">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" className="chip" aria-pressed={value === n} onClick={() => onChange(value === n && optional ? null : n)}>{n}</button>
        ))}
      </div>
    </div>
  )
}

export function ReviewSection({ restaurantId, reviews }: { restaurantId: string; reviews: Review[] }) {
  const addReview = useApp((s) => s.addReview)
  const myTolerance = useApp((s) => s.profile.tolerance)
  const [open, setOpen] = useState(false)
  const [safety, setSafety] = useState<number | null>(null)
  const [taste, setTaste] = useState<number | null>(null)
  const [text, setText] = useState('')

  const taste5 = avg(reviews.map((r) => r.tasteRating))
  const levels: Tolerance[] = ['celiac', 'sensitive', 'preference']
  const safetyByLevel = levels
    .map((l) => ({ l, v: avg(reviews.filter((r) => r.reviewerTolerance === l && r.safetyRating).map((r) => r.safetyRating as number)), n: reviews.filter((r) => r.reviewerTolerance === l && r.safetyRating).length }))
    .filter((x) => x.v !== null)

  return (
    <section className="stack" aria-labelledby="reviews-h">
      <h2 id="reviews-h">Reviews</h2>

      <div className="card stack">
        <div className="row spread"><strong>Taste of GF dishes</strong><span>{taste5 ? <><Stars n={Math.round(taste5)} /> {taste5}</> : <span className="muted">No ratings yet</span>}</span></div>
        <div>
          <strong>How it went for people like you</strong>
          {safetyByLevel.length === 0 ? <p className="muted small" style={{ margin: 0 }}>No safety ratings yet.</p> : (
            <ul style={{ listStyle: 'none', padding: 0, margin: '4px 0 0' }}>
              {safetyByLevel.map((x) => (
                <li key={x.l} className="row spread small" style={{ fontWeight: x.l === myTolerance ? 700 : 400 }}>
                  <span>{TOLERANCE_LABEL[x.l]} reviewers{x.l === myTolerance ? ' (you)' : ''}</span>
                  <span>{x.v} / 5 · {x.n} review{x.n === 1 ? '' : 's'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="muted small" style={{ margin: 0 }}>Safety and taste are rated separately. A preference eater saying “it was fine” does not mean it works for celiac.</p>
      </div>

      {reviews.length === 0 && <p className="muted">No reviews yet. Be the first.</p>}
      {reviews.map((r) => (
        <article key={r.id} className="card stack">
          <div className="row spread wrap">
            <span className="row"><strong>{r.author}</strong><span className="badge info">{TOLERANCE_LABEL[r.reviewerTolerance]}</span></span>
            <span className="muted small">{r.date}{r.sample ? ' · sample' : ''}</span>
          </div>
          <div className="row wrap small">
            <span>Taste <Stars n={r.tasteRating} /></span>
            {r.safetyRating ? <span>Safety experience <Stars n={r.safetyRating} /></span> : <span className="muted">No safety rating</span>}
          </div>
          {r.text && <p style={{ margin: 0 }}>{r.text}</p>}
        </article>
      ))}

      {open ? (
        <form
          className="card stack"
          onSubmit={(e) => {
            e.preventDefault()
            if (taste === null) return
            addReview({ restaurantId, safetyRating: safety as Review['safetyRating'], tasteRating: taste as Review['tasteRating'], text: text.trim() })
            setOpen(false); setSafety(null); setTaste(null); setText('')
          }}
        >
          <h3>Your review</h3>
          <p className="muted small" style={{ margin: 0 }}>Shown as “You · {TOLERANCE_LABEL[myTolerance]}”.</p>
          <RatingPicker label="Taste of the GF food" value={taste} onChange={setTaste} />
          <RatingPicker label="How it went for your body" value={safety} onChange={setSafety} optional />
          <label className="field"><span>What should others know?</span><textarea value={text} onChange={(e) => setText(e.target.value)} /></label>
          <div className="row">
            <button className="btn" type="submit" disabled={taste === null}>Post review</button>
            <button className="btn secondary" type="button" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <button className="btn secondary block" onClick={() => setOpen(true)}>Write a review</button>
      )}
    </section>
  )
}
