# Currency Converter

A fast, elegant currency converter with **locale-aware digit grouping in the input fields** —
the thing most converters get wrong. Built on the free [Frankfurter](https://frankfurter.dev) API.

Live: https://charazer.github.io/currency-converter/

## Features

- **Digit grouping as you type**, in the input itself, with the caret held in place. Separator
  placement comes from `Intl`, so Indian lakh grouping (`12,34,567.89`) and non-Latin numbering
  systems (`١٬٢٣٤٬٥٦٧٫٨٩`) work without special cases.
- Both amount fields are editable and convert in either direction.
- Rounding to each currency's real minor units — 0 for yen, 3 for dinar — with `decimal.js` doing
  the arithmetic, never floats.
- 30/90/365-day rate history, favourite pairs, and a light/dark/system theme.
- Works offline against the last rates it saw, clearly labelled as such.

## Status

Feature complete.

Lighthouse scores 100 for performance, accessibility, best practices and SEO. The suite covers
300 unit tests plus 46 end-to-end tests on Chromium and WebKit, including an axe-core audit,
layout-stability and content-security-policy checks.

## Prerequisites

- Node.js 24 LTS (`nvm use` reads [.nvmrc](.nvmrc))
- pnpm 11 (`corepack enable`)

## Getting started

```sh
pnpm install
pnpm run dev            # http://localhost:5173/currency-converter/
```

For E2E tests, install browsers once: `pnpm exec playwright install chromium webkit`.

## Scripts

| Script                                             | Purpose                         |
| -------------------------------------------------- | ------------------------------- |
| `pnpm run dev`                                     | Dev server                      |
| `pnpm run build`                                   | Type-check and build to `dist/` |
| `pnpm run preview`                                 | Serve the production build      |
| `pnpm run ci`                                      | Frozen-lockfile install         |
| `pnpm run lint` / `lint:fix`                       | ESLint                          |
| `pnpm run format` / `format:check`                 | Prettier                        |
| `pnpm run typecheck`                               | `vue-tsc`                       |
| `pnpm run test`                                    | Unit + E2E                      |
| `pnpm run test:unit[:watch\|:coverage\|:ui]`       | Vitest                          |
| `pnpm run test:e2e[:ui\|:headed\|:debug\|:report]` | Playwright                      |

## Tech stack

TypeScript · Vue 3 · Vite · TanStack Query · Zod · decimal.js · Vitest · Playwright · axe-core ·
ESLint + Prettier · plain CSS (no UI or component library)

Rates come from [Frankfurter](https://frankfurter.dev), which needs no API key. Nothing is sent
anywhere else: no accounts, no analytics, no cookies.
