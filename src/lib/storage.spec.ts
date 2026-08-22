import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { readStored, removeStored, resetStorageCache, storageKeys, writeStored } from './storage'

const schema = z.object({ base: z.string(), quote: z.string() })
const key = storageKeys.pair

beforeEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
  resetStorageCache()
})

describe('storage', () => {
  it('round-trips a value that matches the schema', () => {
    writeStored(key, { base: 'EUR', quote: 'USD' })
    expect(readStored(key, schema)).toEqual({ base: 'EUR', quote: 'USD' })
  })

  it('returns null for a missing key', () => {
    expect(readStored(key, schema)).toBeNull()
  })

  it('discards and removes a value that no longer matches the schema', () => {
    localStorage.setItem(key, JSON.stringify({ base: 'EUR' }))

    expect(readStored(key, schema)).toBeNull()
    expect(localStorage.getItem(key)).toBeNull()
  })

  it('discards unparseable JSON', () => {
    localStorage.setItem(key, '{not json')

    expect(readStored(key, schema)).toBeNull()
    expect(localStorage.getItem(key)).toBeNull()
  })

  it('namespaces every key to survive the shared github.io origin', () => {
    for (const value of Object.values(storageKeys)) expect(value.startsWith('cc:')).toBe(true)
  })

  it('stays silent when storage is unavailable', () => {
    const denied = () => {
      throw new DOMException('denied', 'SecurityError')
    }
    vi.stubGlobal('localStorage', { getItem: denied, setItem: denied, removeItem: denied })
    resetStorageCache()

    expect(() => {
      writeStored(key, { base: 'EUR', quote: 'USD' })
    }).not.toThrow()
    expect(readStored(key, schema)).toBeNull()
    expect(() => {
      removeStored(key)
    }).not.toThrow()
  })

  it('removes a stored value', () => {
    writeStored(key, { base: 'EUR', quote: 'USD' })
    removeStored(key)
    expect(readStored(key, schema)).toBeNull()
  })
})
