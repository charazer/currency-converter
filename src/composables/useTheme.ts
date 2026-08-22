import { computed, ref, watch } from 'vue'
import { z } from 'zod'

import { readStored, storageKeys, writeStored } from '@/lib/storage'

const themeSchema = z.enum(['light', 'dark', 'system'])

export type Theme = z.infer<typeof themeSchema>

export const THEMES: readonly Theme[] = ['light', 'dark', 'system']

const theme = ref<Theme>(readStored(storageKeys.theme, themeSchema) ?? 'system')

/** `system` removes the attribute so the CSS media query takes over, avoiding a flash on load. */
function apply(next: Theme): void {
  const root = globalThis.document?.documentElement
  if (root === undefined) return
  if (next === 'system') root.removeAttribute('data-theme')
  else root.dataset['theme'] = next
}

watch(theme, apply, { immediate: true, flush: 'sync' })

export function useTheme() {
  function setTheme(next: Theme): void {
    theme.value = next
    writeStored(storageKeys.theme, next)
  }

  return {
    theme: computed(() => theme.value),
    setTheme,
  }
}
