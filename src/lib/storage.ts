import type { z } from 'zod'

const PREFIX = 'cc:'

/** The GitHub Pages origin is shared with every other project on it, so keys must be namespaced. */
export const storageKeys = {
  pair: `${PREFIX}pair`,
  favourites: `${PREFIX}favourites`,
  locale: `${PREFIX}locale`,
  theme: `${PREFIX}theme`,
  queryCache: `${PREFIX}query-cache`,
} as const

let resolved: Storage | null | undefined

/** Safari private mode and hardened privacy settings make localStorage throw on use. */
export function getStorage(): Storage | null {
  if (resolved === undefined) {
    try {
      const probe = `${PREFIX}probe`
      globalThis.localStorage.setItem(probe, '1')
      globalThis.localStorage.removeItem(probe)
      resolved = globalThis.localStorage
    } catch {
      resolved = null
    }
  }
  return resolved
}

export function readStored<S extends z.ZodType>(key: string, schema: S): z.infer<S> | null {
  const store = getStorage()
  if (store === null) return null

  const raw = store.getItem(key)
  if (raw === null) return null

  try {
    const parsed = schema.safeParse(JSON.parse(raw))
    if (parsed.success) return parsed.data
  } catch {
    // fall through: unparseable JSON is treated the same as a schema mismatch
  }

  store.removeItem(key)
  return null
}

export function writeStored(key: string, value: unknown): void {
  try {
    getStorage()?.setItem(key, JSON.stringify(value))
  } catch {
    // quota exceeded or storage disabled; persistence is best-effort
  }
}

export function removeStored(key: string): void {
  try {
    getStorage()?.removeItem(key)
  } catch {
    // storage disabled
  }
}

/** Test seam. */
export function resetStorageCache(): void {
  resolved = undefined
}
