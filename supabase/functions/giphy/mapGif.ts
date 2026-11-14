// Pure helpers for the GIPHY proxy. No Deno APIs here so they can be unit tested.

export interface Gif {
  id: string
  title: string
  /** Full-size GIF shown in the log. */
  url: string
  /** Small GIF for the picker grid. */
  previewUrl: string
  width: number
  height: number
}

/** Only ever hand the app links that really point at GIPHY's media servers over https. */
export function isGiphyUrl(u: unknown): u is string {
  if (typeof u !== 'string') return false
  try {
    const url = new URL(u)
    return url.protocol === 'https:' && (url.hostname === 'giphy.com' || url.hostname.endsWith('.giphy.com'))
  } catch {
    return false
  }
}

export function cleanQuery(q: unknown): string {
  return typeof q === 'string' ? q.replace(/\s+/g, ' ').trim().slice(0, 50) : ''
}

export function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.trunc(n))) : fallback
}

// deno-lint-ignore no-explicit-any
type Loose = any

/** Reduces GIPHY's large response to just what the app needs. Skips anything malformed. */
export function mapGiphyResponse(json: unknown): Gif[] {
  const data = (json as Loose)?.data
  if (!Array.isArray(data)) return []
  const out: Gif[] = []
  for (const g of data) {
    const full = g?.images?.fixed_height
    const small = g?.images?.fixed_width_small ?? full
    if (typeof g?.id !== 'string' || !isGiphyUrl(full?.url) || !isGiphyUrl(small?.url)) continue
    out.push({
      id: g.id,
      title: typeof g.title === 'string' && g.title.trim() ? g.title.trim().slice(0, 120) : 'GIF',
      url: full.url,
      previewUrl: small.url,
      width: clampInt(full.width, 1, 2000, 200),
      height: clampInt(full.height, 1, 2000, 200),
    })
  }
  return out
}
