import { computed, ref } from 'vue'

import { z } from '@/lib/zod'

import { readStored, storageKeys, writeStored } from '@/lib/storage'

export interface Pair {
  base: string
  quote: string
}

const pairSchema = z.object({
  base: z.string().regex(/^[A-Z]{3}$/),
  quote: z.string().regex(/^[A-Z]{3}$/),
})

export const MAX_FAVOURITES = 8

const favouritesSchema = z.array(pairSchema).max(MAX_FAVOURITES).catch([])

const favourites = ref<Pair[]>(readStored(storageKeys.favourites, favouritesSchema) ?? [])

function same(a: Pair, b: Pair): boolean {
  return a.base === b.base && a.quote === b.quote
}

export function pairKey(pair: Pair): string {
  return `${pair.base}/${pair.quote}`
}

export function useFavourites() {
  function persist(): void {
    writeStored(storageKeys.favourites, favourites.value)
  }

  function isFavourite(pair: Pair): boolean {
    return favourites.value.some((entry) => same(entry, pair))
  }

  function remove(pair: Pair): void {
    favourites.value = favourites.value.filter((entry) => !same(entry, pair))
    persist()
  }

  /** Newest first, oldest dropped once the list is full. */
  function toggle(pair: Pair): void {
    if (isFavourite(pair)) {
      remove(pair)
      return
    }
    favourites.value = [pair, ...favourites.value].slice(0, MAX_FAVOURITES)
    persist()
  }

  return {
    favourites: computed(() => favourites.value),
    isFavourite,
    toggle,
    remove,
  }
}

/** Test seam: the list is module-scoped and outlives any component. */
export function resetFavourites(): void {
  favourites.value = []
}
