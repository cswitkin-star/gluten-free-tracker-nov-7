import { describe, expect, it } from 'vitest'
import { cleanQuery, clampInt, isGiphyUrl, mapGiphyResponse } from './mapGif'

const good = (id: string) => ({
  id,
  title: ' Happy dance ',
  images: {
    fixed_height: { url: `https://media2.giphy.com/media/${id}/200.gif`, width: '356', height: '200' },
    fixed_width_small: { url: `https://media2.giphy.com/media/${id}/100w.gif`, width: '100', height: '56' },
  },
})

describe('isGiphyUrl', () => {
  it('accepts https links on giphy.com hosts', () => {
    expect(isGiphyUrl('https://media0.giphy.com/media/abc/200.gif')).toBe(true)
    expect(isGiphyUrl('https://giphy.com/x.gif')).toBe(true)
  })
  it('rejects look-alikes, http, junk and non-strings', () => {
    expect(isGiphyUrl('http://media.giphy.com/x.gif')).toBe(false)
    expect(isGiphyUrl('https://evilgiphy.com/x.gif')).toBe(false)
    expect(isGiphyUrl('https://giphy.com.evil.example/x.gif')).toBe(false)
    expect(isGiphyUrl('javascript:alert(1)')).toBe(false)
    expect(isGiphyUrl('not a url')).toBe(false)
    expect(isGiphyUrl(42)).toBe(false)
  })
})

describe('mapGiphyResponse', () => {
  it('keeps only what the app needs and converts sizes to numbers', () => {
    const [g] = mapGiphyResponse({ data: [good('abc')], pagination: {}, meta: {} })
    expect(g).toEqual({
      id: 'abc', title: 'Happy dance',
      url: 'https://media2.giphy.com/media/abc/200.gif',
      previewUrl: 'https://media2.giphy.com/media/abc/100w.gif',
      width: 356, height: 200,
    })
  })
  it('skips entries with missing ids or non-GIPHY image links', () => {
    const evil = good('x')
    evil.images.fixed_height.url = 'https://evil.example/a.gif'
    const noId = { ...good('y'), id: undefined }
    expect(mapGiphyResponse({ data: [evil, noId, good('ok')] }).map((g) => g.id)).toEqual(['ok'])
  })
  it('falls back to a generic title and survives garbage input', () => {
    expect(mapGiphyResponse({ data: [{ ...good('t'), title: '' }] })[0].title).toBe('GIF')
    expect(mapGiphyResponse(null)).toEqual([])
    expect(mapGiphyResponse({ data: 'nope' })).toEqual([])
  })
})

describe('input cleaning', () => {
  it('trims, collapses spaces and caps the query at 50 characters', () => {
    expect(cleanQuery('  happy   dance ')).toBe('happy dance')
    expect(cleanQuery('x'.repeat(80))).toHaveLength(50)
    expect(cleanQuery(undefined)).toBe('')
    expect(cleanQuery({})).toBe('')
  })
  it('clamps numbers into range', () => {
    expect(clampInt(100, 1, 24, 12)).toBe(24)
    expect(clampInt(-5, 0, 200, 0)).toBe(0)
    expect(clampInt('7', 1, 24, 12)).toBe(7)
    expect(clampInt('abc', 1, 24, 12)).toBe(12)
    expect(clampInt(undefined, 1, 24, 12)).toBe(12)
  })
})
