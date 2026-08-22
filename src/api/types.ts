export interface Currency {
  code: string
  name: string
  symbol: string | null
  startDate: string | null
  endDate: string | null
}

/** Every quote for one base currency on a single date, as published by the API. */
export interface RateTable {
  base: string
  date: string
  rates: Readonly<Record<string, number>>
}

export interface HistoryPoint {
  date: string
  rate: number
}
