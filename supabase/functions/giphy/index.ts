// GIPHY proxy. Keeps the API key on the server and only answers signed-in users.
// Set the key once:  Supabase dashboard > Edge Functions > Secrets > GIPHY_API_KEY
// (a secret simply named GIPHY also works)
import { cleanQuery, clampInt, mapGiphyResponse } from './mapGif.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

/** verify_jwt has already checked the signature. We only read the role: anonymous keys are not enough. */
function roleOf(req: Request): string | null {
  try {
    const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? ''
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(payload + '='.repeat((4 - (payload.length % 4)) % 4))).role ?? null
  } catch {
    return null
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
  if (roleOf(req) !== 'authenticated') return json({ error: 'sign_in_required' }, 401)

  const apiKey = Deno.env.get('GIPHY_API_KEY') ?? Deno.env.get('GIPHY')
  if (!apiKey) return json({ error: 'not_configured' }, 503)

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    /* an empty body means "trending" */
  }
  const q = cleanQuery(body.q)
  const limit = clampInt(body.limit, 1, 24, 12)
  const offset = clampInt(body.offset, 0, 200, 0)

  const url = new URL(`https://api.giphy.com/v1/gifs/${q ? 'search' : 'trending'}`)
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('offset', String(offset))
  url.searchParams.set('rating', 'pg') // keep results family friendly
  url.searchParams.set('lang', 'en')
  if (q) url.searchParams.set('q', q)

  let res: Response
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  } catch {
    return json({ error: 'upstream_unreachable' }, 502)
  }
  if (res.status === 429) return json({ error: 'rate_limited' }, 429)
  if (!res.ok) return json({ error: 'upstream_error' }, 502)

  return json({ gifs: mapGiphyResponse(await res.json()), query: q })
})
