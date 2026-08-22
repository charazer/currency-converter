import { computed, ref } from 'vue'

import { z } from '@/lib/zod'

import { readStored, removeStored, storageKeys, writeStored } from '@/lib/storage'

const localeSchema = z.string().min(2).max(35)

/** Locales offered in the UI. "System" is represented by a null override, not an entry here. */
export const SUPPORTED_LOCALES = [
  'en-US',
  'en-GB',
  'en-IN',
  'de-DE',
  'de-CH',
  'fr-FR',
  'es-ES',
  'it-IT',
  'nl-NL',
  'pt-BR',
  'pl-PL',
  'ru-RU',
  'ja-JP',
  'zh-CN',
  'ko-KR',
  'ar-EG',
] as const

const FALLBACK_LOCALE = 'en-US'

function isUsable(locale: string): boolean {
  try {
    return Intl.getCanonicalLocales(locale).length > 0
  } catch {
    return false
  }
}

export function resolveSystemLocale(): string {
  const candidates = [...(globalThis.navigator?.languages ?? []), globalThis.navigator?.language]
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate !== '' && isUsable(candidate)) return candidate
  }
  return FALLBACK_LOCALE
}

const stored = readStored(storageKeys.locale, localeSchema)
const override = ref<string | null>(stored !== null && isUsable(stored) ? stored : null)

export function useLocale() {
  const systemLocale = computed(resolveSystemLocale)
  const locale = computed(() => override.value ?? systemLocale.value)

  function setLocale(next: string | null): void {
    if (next === null) {
      override.value = null
      removeStored(storageKeys.locale)
      return
    }
    if (!isUsable(next)) return
    override.value = next
    writeStored(storageKeys.locale, next)
  }

  return { locale, override, systemLocale, setLocale }
}
