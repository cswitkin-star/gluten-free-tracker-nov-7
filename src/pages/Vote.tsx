import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ShareButton } from '../components/ShareButton'
import { decodePayload, isInvite, replyUrl, type Vote as VoteValue } from '../group/share'
import { PRICE_LABEL } from '../lib/labels'

const CHOICES: { v: VoteValue; icon: string; label: string }[] = [
  { v: 'yes', icon: '👍', label: 'Yes' },
  { v: 'maybe', icon: '🤔', label: 'Maybe' },
  { v: 'no', icon: '👎', label: 'No' },
]

/**
 * Public page for friends: no account, no profile, and nothing about anyone's diet.
 * Works with only the link.
 */
export default function Vote() {
  const { payload = '' } = useParams()
  const invite = (() => {
    const p = decodePayload<unknown>(payload)
    return isInvite(p) ? p : null
  })()
  const [name, setName] = useState('')
  const [votes, setVotes] = useState<Record<string, VoteValue>>({})
  const [done, setDone] = useState(false)

  if (!invite) {
    return (
      <div className="empty">
        <div className="big" aria-hidden>🔗</div>
        <p>This link looks broken. Ask whoever sent it to share it again.</p>
      </div>
    )
  }

  const answered = Object.keys(votes).length
  const reply = replyUrl({ v: 1, g: invite.g, who: name.trim() || 'Friend', votes })

  if (done) {
    return (
      <div className="stack">
        <h1>Thanks{name.trim() ? `, ${name.trim()}` : ''}!</h1>
        <div className="card stack">
          <p style={{ margin: 0 }}>Last step: send your votes back to whoever invited you. Tap the button and share the link in your chat.</p>
          <ShareButton label="Send my votes" text={`My votes for ${invite.t}:`} url={reply} />
          <button className="btn secondary" onClick={() => setDone(false)}>Change my votes</button>
        </div>
      </div>
    )
  }

  return (
    <div className="stack">
      <h1>{invite.t}</h1>
      <p className="muted" style={{ margin: 0 }}>Party of {invite.n}. Tell us which of these you would be into.</p>

      <label className="field"><span>Your name</span>
        <input type="text" value={name} maxLength={30} onChange={(e) => setName(e.target.value)} />
      </label>

      {invite.o.map((o) => (
        <div key={o.id} className="card stack">
          <div>
            <strong>{o.name}</strong>
            <div className="muted small">{o.cuisine} · {PRICE_LABEL(o.price)} · {o.neighborhood}</div>
          </div>
          <div className="row wrap" role="radiogroup" aria-label={`Vote for ${o.name}`}>
            {CHOICES.map((c) => (
              <button key={c.v} type="button" className="chip" role="radio" aria-checked={votes[o.id] === c.v} aria-pressed={votes[o.id] === c.v}
                onClick={() => setVotes((cur) => ({ ...cur, [o.id]: c.v }))}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="sticky-actions">
        <button className="btn block" disabled={answered === 0} onClick={() => setDone(true)}>
          Done ({answered} of {invite.o.length})
        </button>
      </div>
    </div>
  )
}
