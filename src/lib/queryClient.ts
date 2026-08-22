import { persistQueryClient } from '@tanstack/query-persist-client-core'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { QueryClient } from '@tanstack/vue-query'

import { ApiError } from '@/api/errors'

import { getStorage, storageKeys } from './storage'

const MAX_RETRIES = 2
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000
const PERSIST_THROTTLE = 0

/** Bump to discard persisted caches whose shape no longer matches the code. */
const CACHE_BUSTER = 'v1'

export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: CACHE_MAX_AGE,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (failureCount >= MAX_RETRIES) return false
          return error instanceof ApiError ? error.retryable : true
        },
      },
    },
  })
}

/** Lets a cold, offline load render the last known rates instead of an error. */
export async function persistQueryCache(queryClient: QueryClient): Promise<void> {
  const storage = getStorage()
  if (storage === null) return

  const [, restored] = persistQueryClient({
    queryClient,
    persister: createSyncStoragePersister({
      storage,
      key: storageKeys.queryCache,
      // The default 1s throttle loses the cache if the tab closes right after load. The payload is a
      // couple of kB and only changes on a fetch, so writing eagerly costs nothing.
      throttleTime: PERSIST_THROTTLE,
    }),
    maxAge: CACHE_MAX_AGE,
    buster: CACHE_BUSTER,
  })

  try {
    await restored
  } catch {
    // a corrupt or unreadable cache just means we start cold
  }
}
