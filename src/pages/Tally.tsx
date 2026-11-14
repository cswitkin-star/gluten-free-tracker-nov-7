import { useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { decodePayload, isReply } from '../group/share'
import { useGroups } from '../store/useGroups'

/** Organizer opens a friend's reply link: merge the votes, then jump to the group. */
export default function Tally() {
  const { payload = '' } = useParams()
  const mergeReply = useGroups((s) => s.mergeReply)
  const nav = useNavigate()
  const ran = useRef(false)

  const reply = useMemo(() => {
    const p = decodePayload<unknown>(payload)
    return isReply(p) ? p : null
  }, [payload])
  const hasGroup = useGroups((s) => (reply ? s.groups.some((g) => g.id === reply.g) : false))

  useEffect(() => {
    if (ran.current || !reply || !hasGroup) return
    ran.current = true
    mergeReply(reply)
    nav(`/groups/${reply.g}`, { replace: true })
  }, [reply, hasGroup, mergeReply, nav])

  const error = !reply
    ? 'This does not look like a vote link.'
    : !hasGroup
      ? 'This vote is for a group that is not on this device. Open it on the phone where you planned the dinner.'
      : ''

  if (!error) return <p className="muted">Adding votes…</p>
  return (
    <div className="empty">
      <p>{error}</p>
      <Link className="btn" to="/groups">Go to groups</Link>
    </div>
  )
}
