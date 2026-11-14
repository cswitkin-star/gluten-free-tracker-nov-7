import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ShareButton } from '../components/ShareButton'
import { decodePayload, extractPayload, inviteUrl, isReply } from '../group/share'
import { tally } from '../group/tally'
import { PRICE_LABEL } from '../lib/labels'
import { useGroups } from '../store/useGroups'

export default function GroupDetail() {
  const { id = '' } = useParams()
  const group = useGroups((s) => s.groups.find((g) => g.id === id))
  const mergeReply = useGroups((s) => s.mergeReply)
  const removeGroup = useGroups((s) => s.removeGroup)
  const nav = useNavigate()
  const [pasted, setPasted] = useState('')
  const [msg, setMsg] = useState('')

  if (!group) {
    return (
      <div className="empty">
        <p>We could not find that group on this device.</p>
        <Link className="btn" to="/groups">Back to groups</Link>
      </div>
    )
  }

  const url = inviteUrl({ v: 1, g: group.id, t: group.title, n: group.size, o: group.options })
  const rows = tally(group.options, group.votes)
  const voters = Object.keys(group.votes)

  const addPasted = () => {
    const payload = decodePayload<unknown>(extractPayload(pasted))
    if (!isReply(payload)) return setMsg('That does not look like a vote link.')
    if (!mergeReply(payload)) return setMsg('That vote is for a different group.')
    setMsg(`Added ${payload.who}’s votes.`)
    setPasted('')
  }

  return (
    <div className="stack">
      <Link to="/groups" className="small">← All groups</Link>
      <h1>{group.title}</h1>
      <p className="muted" style={{ margin: 0 }}>Party of {group.size}{group.size >= 6 ? ' · call ahead to book' : ''}</p>

      <section className="card stack">
        <h2>1. Send the link</h2>
        <p className="muted" style={{ margin: 0 }}>Friends open it in any browser, no app or account. The link only shows the restaurant options.</p>
        <div className="row wrap">
          <ShareButton label="Share link" text={`Help pick: ${group.title}`} url={url} />
        </div>
        <label className="field"><span className="small muted">Or copy it</span>
          <input type="text" readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
        </label>
      </section>

      <section className="card stack">
        <h2>2. Collect votes</h2>
        <p className="muted" style={{ margin: 0 }}>
          There is no server, so votes come back as a link. Each friend taps “Send my votes” and messages you the link. Open it, or paste it here.
        </p>
        <label className="field"><span className="small muted">Paste a vote link</span>
          <input type="text" value={pasted} onChange={(e) => setPasted(e.target.value)} />
        </label>
        <button className="btn secondary" disabled={!pasted.trim()} onClick={addPasted}>Add votes</button>
        {msg && <div className="notice" role="status">{msg}</div>}
      </section>

      <section className="stack" aria-labelledby="res-h">
        <h2 id="res-h">Results {voters.length > 0 && <span className="muted small">({voters.join(', ')})</span>}</h2>
        {rows.map((r) => (
          <Link key={r.option.id} className="card" to={`/restaurant/${r.option.id}`}>
            <div className="row spread" style={{ alignItems: 'flex-start' }}>
              <div>
                <strong>{r.option.name}</strong>
                <div className="muted small">{r.option.cuisine} · {PRICE_LABEL(r.option.price)} · {r.option.neighborhood}</div>
              </div>
              {r.leading && <span className="badge great">✓ Leading</span>}
            </div>
            <div className="row wrap small" style={{ marginTop: 6 }}>
              <span>👍 {r.yes}</span><span>🤔 {r.maybe}</span><span>👎 {r.no}</span>
            </div>
          </Link>
        ))}
        {voters.length === 0 && <p className="muted small">No votes yet.</p>}
      </section>

      <button className="btn danger" onClick={() => { if (window.confirm('Delete this group?')) { removeGroup(group.id); nav('/groups') } }}>Delete group</button>
    </div>
  )
}
