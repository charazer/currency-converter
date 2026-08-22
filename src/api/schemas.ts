import { z } from '@/lib/zod'

export const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/
export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const nullableString = z.string().nullable().default(null)

export const apiCurrencySchema = z.object({
  iso_code: z.string(),
  name: z.string(),
  symbol: nullableString,
  start_date: nullableString,
  end_date: nullableString,
})

export const apiCurrencyListSchema = z.array(apiCurrencySchema)

export const apiRateSchema = z.object({
  date: z.string().regex(ISO_DATE_PATTERN),
  base: z.string(),
  quote: z.string(),
  rate: z.number().positive().finite(),
})

export const apiRateListSchema = z.array(apiRateSchema)

export type ApiCurrency = z.infer<typeof apiCurrencySchema>
export type ApiRate = z.infer<typeof apiRateSchema>
