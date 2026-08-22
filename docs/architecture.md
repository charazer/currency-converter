# Architecture

## Stack

| Layer        | Choice                                                  | Notes                                                           |
| ------------ | ------------------------------------------------------- | --------------------------------------------------------------- |
| Build        | Vite 7                                                  | `base: '/currency-converter/'` for Pages                        |
| Language     | TypeScript, `strict: true` + `noUncheckedIndexedAccess` | No `any`, no non-null `!`                                       |
| UI           | Vue 3.5, `<script setup lang="ts">`                     | SPA, no SSR                                                     |
| Routing      | none (single view)                                      | Add `vue-router` only if a history page is split out            |
| State        | Composables + `pinia` for the converter store           | Pinia only where state is shared across ≥2 components           |
| Server state | TanStack Query (`@tanstack/vue-query`)                  | Caching, retry, stale handling, dedupe                          |
| Validation   | Zod                                                     | Parse API responses at the boundary                             |
| Money        | decimal.js-light                                        | All rate math and rounding                                      |
| Styling      | Plain CSS + `@layer` + custom properties                | No framework; small surface, full control over tokens           |
| Icons        | `unplugin-icons` + Lucide                               | Tree-shaken inline SVG                                          |
| Chart        | `unovis` or hand-rolled SVG sparkline                   | Prefer hand-rolled; only add a lib if axes/tooltips get painful |

No UI component library — the app is ~6 components; a library would outweigh the app.

## Layout

```
src/
  api/            frankfurter.ts (client), schemas.ts (Zod), errors.ts, queries.ts, types.ts
  composables/    useRates.ts, useCurrencies.ts, useLocale.ts, useTheme.ts, useFavourites.ts
  lib/            numberFormat.ts, numberParse.ts, convert.ts, storage.ts, queryClient.ts
  components/     ConverterCard.vue, AmountField.vue, CurrencySelect.vue,
                  SwapButton.vue, RateChart.vue, RateNote.vue, ThemeToggle.vue
  stores/         converter.ts
  styles/         tokens.css, base.css
  test/           setup.ts, handlers.ts (MSW)
  App.vue  main.ts
docs/  e2e/  .github/workflows/
```

Rule: `lib/` is pure and framework-free (fully unit-testable), `composables/` bind it to Vue.
Tests sit next to their subject as `*.spec.ts`.

## Data layer

Base: `https://api.frankfurter.dev/v2`

| Need                  | Request                                                                             |
| --------------------- | ----------------------------------------------------------------------------------- |
| Currency list         | `GET /currencies` → `{iso_code, iso_numeric, name, symbol, start_date, end_date}[]` |
| Latest pair           | `GET /rate/{base}/{quote}` → `{date, base, quote, rate}`                            |
| All quotes for a base | `GET /rates?base=EUR` → `Rate[]` (includes identity row)                            |
| History               | `GET /rates?base=X&quotes=Y&from=…&to=…`                                            |

- Fetch **all quotes for the selected base** in one call, not per-pair — one request covers a swap
  and any target change. `fetchRateTable` collapses the row array into `{ base, date, rates }`.
- Rates stay plain `number` through the client and the query cache so the cache stays
  JSON-serialisable; `Decimal` is constructed at the conversion boundary in `lib/convert.ts`.
  Doubles represent the API's ~6-significant-digit rates exactly, so nothing is lost.
- Currency codes are regex-validated before they reach a URL; malformed input fails before a
  request is made.
- Errors are normalised to `ApiError` with a `kind` of `not-found` (404), `invalid-request`
  (400/422), `unavailable` (5xx), `network` (fetch threw) or `malformed` (schema mismatch).
  Only `network` and `unavailable` are `retryable`; aborts propagate untouched.

## Caching

- TanStack Query: currencies `staleTime: 24h`, rates `staleTime: 1h`, `retry: 2` w/ backoff.
- Persist the query cache to `localStorage` (`@tanstack/query-persist-client`) so a cold, offline
  load still shows the last known rates, flagged as stale with their date.
- `localStorage` keys namespaced `cc:` — `cc:pair`, `cc:favourites`, `cc:locale`, `cc:theme`.
  All reads go through `lib/storage.ts`, schema-validated, corrupt values discarded silently.

## Security / robustness

- No secrets, no auth, no user data leaves the browser.
- Never `v-html`; all API strings render as text.
- CSP meta tag: `default-src 'self'; connect-src 'self' https://api.frankfurter.dev; img-src 'self' data:`.
- `Number.parseFloat` on untrusted input only via the guarded parser in `lib/numberParse.ts`.

## GitHub Pages constraints (checked)

Nothing in this plan is blocked. Things the plan has to work around:

| Constraint                                         | Consequence                                                                                                                                                                            |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Static hosting, no server code                     | Fine — API is called directly from the browser. No proxy, no rate-limit shielding, no secrets possible (we need none).                                                                 |
| No control over response headers                   | CSP must be a `<meta http-equiv>` tag, so `frame-ancestors`/`report-uri` are unavailable. Use `X-Frame-Options`-equivalent framing defence in JS if it ever matters (it doesn't here). |
| Served from `/currency-converter/` subpath         | Vite `base` must be set; all asset URLs relative; any future service worker is scoped to the subpath.                                                                                  |
| No SPA rewrite rules                               | We ship a single view, so this is moot. If routing is ever added, copy `index.html` → `404.html` at build.                                                                             |
| HTTPS enforced                                     | API must be HTTPS — Frankfurter v2 is, and returns `access-control-allow-origin: *`, verified against a `github.io` origin. No mixed-content or CORS problem.                          |
| Shared origin `charazer.github.io`                 | **`localStorage` is shared with every other project on that user site.** The `cc:` key prefix is mandatory, not cosmetic. Same applies to the persisted query cache key.               |
| Asset caching not configurable                     | Vite content-hashes assets, so this is safe. `index.html` is served with a ~10 min cache — expect that delay after a deploy.                                                           |
| Deploy source setting                              | Pages must be set to "GitHub Actions" in repo settings once, manually. Workflow needs `permissions: {pages: write, id-token: write}`.                                                  |
| Soft usage limits (100 GB/mo bandwidth, 1 GB repo) | Irrelevant at this size; the <150 kB budget keeps it that way.                                                                                                                         |
