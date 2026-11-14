import { useState } from 'react'

/** Uses the phone's share sheet when available, otherwise copies the text. */
export function ShareButton({ text, url, label, className = 'btn' }: { text: string; url: string; label: string; className?: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')

  const share = async () => {
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ text, url })
        return
      }
      await navigator.clipboard.writeText(`${text} ${url}`)
      setState('copied')
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return
      setState('failed')
    }
    setTimeout(() => setState('idle'), 2500)
  }

  return (
    <>
      <button className={className} onClick={share}>{label}</button>
      <span className="small muted" aria-live="polite">
        {state === 'copied' && 'Link copied'}
        {state === 'failed' && 'Could not share. Copy the link manually.'}
      </span>
    </>
  )
}
