import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Gif } from '../types'

export const GIFS_PER_PAGE = 12

/** Only render GIFs whose links really point at GIPHY over https (guards against tampered synced data). */
export function isGiphyUrl(u: unknown): u is string {
  if (typeof u !== 'string') return false
  try {
    const url = new URL(u)
    return url.protocol === 'https:' && (url.hostname === 'giphy.com' || url.hostname.endsWith('.giphy.com'))
  } catch {
    return false
  }
}

export const isSafeGif = (g: Gif | undefined): g is Gif => !!g && isGiphyUrl(g.url) && isGiphyUrl(g.previewUrl)

export type GifErrorCode = 'not_configured' | 'sign_in_required' | 'rate_limited' | 'failed'

export class GifError extends Error {
  code: GifErrorCode
  constructor(code: GifErrorCode) {
    super(code)
    this.code = code
  }
}

export const GIF_ERROR_TEXT: Record<GifErrorCode, string> = {
  not_configured: 'GIF search is not switched on yet.',
  sign_in_required: 'Sign in to add GIFs.',
  rate_limited: 'A lot of people are searching right now. Try again in a minute.',
  failed: 'Could not load GIFs. Please try again.',
}

/** Searches through our own Supabase function, so the GIPHY key never reaches the browser. Empty query means trending. */
export async function searchGifs(q: string, offset = 0): Promise<Gif[]> {
  if (!supabase) throw new GifError('not_configured')
  const { data, error } = await supabase.functions.invoke('giphy', { body: { q, offset, limit: GIFS_PER_PAGE } })
  if (error) {
    let code: GifErrorCode = 'failed'
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null)
      const c = (body as { error?: string } | null)?.error
      if (c === 'not_configured' || c === 'sign_in_required' || c === 'rate_limited') code = c
    }
    throw new GifError(code)
  }
  const gifs = (data as { gifs?: Gif[] } | null)?.gifs
  return Array.isArray(gifs) ? gifs.filter(isSafeGif) : []
}
