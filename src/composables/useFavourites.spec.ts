import { beforeEach, describe, expect, it } from 'vitest'

import { storageKeys } from '@/lib/storage'

import { MAX_FAVOURITES, pairKey, resetFavourites, useFavourites } from './useFavourites'

const EUR_USD = { base: 'EUR', quote: 'USD' }
const GBP_JPY = { base: 'GBP', quote: 'JPY' }

beforeEach(() => {
  localStorage.clear()
  resetFavourites()
})

describe('useFavourites', () => {
  it('starts empty', () => {
    expect(useFavourites().favourites.value).toEqual([])
  })

  it('adds a pair', () => {
    const { toggle, favourites, isFavourite } = useFavourites()
    toggle(EUR_USD)
    expect(favourites.value).toEqual([EUR_USD])
    expect(isFavourite(EUR_USD)).toBe(true)
  })

  it('removes a pair when toggled again', () => {
    const { toggle, favourites } = useFavourites()
    toggle(EUR_USD)
    toggle(EUR_USD)
    expect(favourites.value).toEqual([])
  })

  it('treats the reversed pair as a different one', () => {
    const { toggle, isFavourite } = useFavourites()
    toggle(EUR_USD)
    expect(isFavourite({ base: 'USD', quote: 'EUR' })).toBe(false)
  })

  it('keeps the newest first', () => {
    const { toggle, favourites } = useFavourites()
    toggle(EUR_USD)
    toggle(GBP_JPY)
    expect(favourites.value[0]).toEqual(GBP_JPY)
  })

  it('drops the oldest once full', () => {
    const { toggle, favourites } = useFavourites()
    for (let index = 0; index < MAX_FAVOURITES + 3; index += 1) {
      toggle({ base: 'EUR', quote: `C${String(index).padStart(2, '0')}` })
    }
    expect(favourites.value).toHaveLength(MAX_FAVOURITES)
    expect(favourites.value[0]?.quote).toBe('C10')
  })

  it('removes a specific pair', () => {
    const { toggle, remove, favourites } = useFavourites()
    toggle(EUR_USD)
    toggle(GBP_JPY)
    remove(EUR_USD)
    expect(favourites.value).toEqual([GBP_JPY])
  })

  it('persists to storage', () => {
    useFavourites().toggle(EUR_USD)
    expect(JSON.parse(localStorage.getItem(storageKeys.favourites) ?? 'null')).toEqual([EUR_USD])
  })
})

describe('pairKey', () => {
  it('is unique per direction', () => {
    expect(pairKey(EUR_USD)).toBe('EUR/USD')
    expect(pairKey({ base: 'USD', quote: 'EUR' })).toBe('USD/EUR')
  })
})
