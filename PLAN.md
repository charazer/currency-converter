# Currency Converter — Plan

Single-pair currency converter, deployed as a static GitHub Page.
Differentiator: **correct, locale-aware digit grouping in the input fields themselves**.

## Docs

| File                                               | Contents                                       |
| -------------------------------------------------- | ---------------------------------------------- |
| [docs/architecture.md](docs/architecture.md)       | Stack, folder layout, data layer, caching      |
| [docs/functional-spec.md](docs/functional-spec.md) | Behaviour, number formatting rules, edge cases |
| [docs/design.md](docs/design.md)                   | Design principles, tokens, layout, a11y        |
| [docs/quality.md](docs/quality.md)                 | Testing, linting, CI, deployment               |

## Scope

In: single pair conversion, currency search/select, locale-aware formatted inputs,
30/90/365-day rate chart, favourite pairs, dark/light theme, offline-tolerant rate cache.

Out: multi-target conversion, PWA install, accounts, fees/spreads, crypto, i18n of UI copy
(UI is English; only _number/date formatting_ is localised).

## Milestones

1. ~~**Scaffold** — Vite + Vue 3 + TS, ESLint/Prettier, Vitest, Playwright, CI, GH Pages deploy.~~ ✅
2. **Data layer** — typed Frankfurter client, Zod validation, TanStack Query, cache.
3. **Formatting core** — `useLocaleNumber` parse/format engine + unit tests (highest test priority).
4. **Converter UI** — currency pickers, amount inputs, swap, live conversion.
5. **Extras** — chart, favourites, theme, last-updated/stale indicator.
6. **Polish** — a11y pass, Lighthouse, error/empty/offline states, README.

## Decisions

| Topic        | Choice                                                     | Why                                                                             |
| ------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Framework    | Vue 3 (`<script setup>`, Composition API)                  | Requested; SFCs keep formatting logic isolated                                  |
| API          | Frankfurter **v2** (`api.frankfurter.dev/v2`)              | Free, no key, flat arrays, 201 currencies                                       |
| Hosting      | GitHub Pages via Actions, base path `/currency-converter/` | Requested                                                                       |
| Money math   | `decimal.js-light`                                         | Float rounding is unacceptable for money                                        |
| Formatting   | `Intl.NumberFormat` + custom parser                        | Native localisation, no locale data bundled                                     |
| UI library   | None                                                       | ~6 components; a library would outweigh the app and fight the number typography |
| Inputs       | Text fields, not `type="number"`                           | Required for live group separators; hence the hand-written parser               |
| Runtime      | Node 24 LTS, pnpm 11                                       | Matches `charazer/kana-game`                                                    |
| Dependencies | Renovate (`renovate.json`), weekly, automerge non-major    | Matches `charazer/kana-game`; no Dependabot                                     |

GitHub Pages feasibility was checked against the whole plan — see
[docs/architecture.md](docs/architecture.md#github-pages-constraints-checked). Nothing is blocked.
