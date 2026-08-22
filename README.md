# Currency Converter

A fast, elegant currency converter with **locale-aware digit grouping in the input fields** —
the thing most converters get wrong. Built on the free [Frankfurter](https://frankfurter.dev) API.

Live: https://charazer.github.io/currency-converter/

## Status

Milestone 1 (scaffold). See [PLAN.md](PLAN.md) and [docs/](docs/) for the full plan.

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

TypeScript · Vue 3 · Vite · Vitest · Playwright · ESLint + Prettier · plain CSS (no UI library)
