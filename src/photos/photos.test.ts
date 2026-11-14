import { describe, expect, it } from 'vitest'
import { fitWithin } from './image'
import { photoPath } from './photos'

describe('fitWithin', () => {
  it('shrinks a large landscape photo to 1600 on the long side', () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 1600, height: 1200 })
  })
  it('shrinks a portrait photo by its height', () => {
    expect(fitWithin(3000, 4000)).toEqual({ width: 1200, height: 1600 })
  })
  it('never scales a small image up', () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 })
  })
  it('keeps at least 1px on each side', () => {
    expect(fitWithin(10000, 1).height).toBeGreaterThanOrEqual(1)
  })
})

describe('photoPath', () => {
  it('puts the photo in the user’s own folder as a jpg', () => {
    expect(photoPath('user-123', 'abc')).toBe('user-123/abc.jpg')
  })
  it('makes a unique name each time', () => {
    expect(photoPath('u')).not.toBe(photoPath('u'))
  })
})
