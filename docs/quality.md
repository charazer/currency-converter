# Quality, Tooling & Delivery

## Tooling

| Concern         | Tool                                                                                                               |
| --------------- | ------------------------------------------------------------------------------------------------------------------ |
| Node            | 24 LTS — exact version in `.nvmrc` (`24.19.0`), CI reads it via `actions/setup-node` `node-version-file`           |
| Package manager | pnpm 11 via Corepack, `packageManager` pinned in `package.json`                                                    |
| pnpm policy     | `pnpm-workspace.yaml`: `minimumReleaseAge: 4320` (3d), `pmOnFail: error`, `allowBuilds: {esbuild: true}`           |
| Lint            | ESLint 9 flat config: `eslint-plugin-vue`, `typescript-eslint` (type-checked), `eslint-plugin-vuejs-accessibility` |
| Format          | Prettier (ESLint handles rules only, no stylistic overlap)                                                         |
| Types           | `vue-tsc --noEmit` in CI                                                                                           |
| Hooks           | husky + lint-staged: eslint --fix + prettier on staged files                                                       |

Scripts mirror `charazer/kana-game`: `dev`, `build`, `preview`, `ci` (frozen-lockfile install),
`lint`, `typecheck`, `test`, `test:unit(:watch|:coverage|:ui)`, `test:e2e(:ui|:headed|:debug|:report)`.

Lint rules that matter: no `any`, no floating promises, exhaustive switch, no unused vars,
`vue/multi-word-component-names` off (we use `App.vue`-style names deliberately).

## Testing

| Level     | Tool                                         | Target                                                                                                                                                                      |
| --------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit      | Vitest                                       | `lib/*` — parser, formatter, converter. **The formatting engine is the priority: ≥95% coverage, table-driven across ≥8 locales.**                                           |
| Component | Vitest + `@vue/test-utils` + Testing Library | `AmountField`, `CurrencySelect` — typing, caret, keyboard nav                                                                                                               |
| Contract  | Vitest + MSW                                 | Zod schemas vs recorded Frankfurter fixtures; one opt-in live test (`TEST_LIVE=1`) to catch API drift                                                                       |
| E2E       | Playwright (Chromium + WebKit)               | Convert, swap, reload persistence, offline, dark mode                                                                                                                       |
| A11y      | `@axe-core/playwright`                       | Zero violations across WCAG 2.0/2.1/2.2 A and AA, on the loaded view, with the listbox open, in dark theme and in the error state. Plus tab order and focus-visible checks. |
| Security  | Playwright                                   | Zero `securitypolicyviolation` events — a blocked `eval` is swallowed by the library that tried it, so only an explicit check catches it                                    |

Formatting test matrix: `en-US`, `de-DE`, `fr-FR` (NBSP), `en-IN` (lakh grouping), `de-CH` (`'`),
`ja-JP` (0 decimals), `ar-EG` (Eastern Arabic digits), `pt-BR`. Cases per locale: empty, `0`,
trailing separator, trailing zeros, paste with wrong separators, caret position after edit-in-middle.

No snapshot tests for anything locale-dependent — assert semantics, not strings, except in the
explicit formatting matrix.

## Verified

Lighthouse (production build, headless Chrome): performance, accessibility, best practices and SEO
all 100. Re-run with `pnpm run preview` and
`CHROME_PATH=<playwright chrome> pnpm dlx lighthouse@12 <url> --only-categories=…`.

## CI (`.github/workflows/ci.yml`)

On push + PR: `pnpm ci` (cached) → `lint` → `format:check` → `typecheck` → `test:unit:coverage` →
`build` → `test:e2e`. Required to merge. Playwright uses the `github` reporter when `process.env.CI`
and uploads its report as an artifact on failure.

## Dependencies — Renovate

`renovate.json` at repo root, matching the kana-game setup:

```jsonc
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended", "security:minimumReleaseAgeNpm", "schedule:weekly"],
  "prHourlyLimit": 0,
  "packageRules": [
    { "matchUpdateTypes": ["major"], "automerge": false },
    { "matchUpdateTypes": ["minor", "patch"], "matchCurrentVersion": "!/^0/", "automerge": true },
  ],
}
```

Renovate also manages `.nvmrc` and GitHub Action versions. Keep the 3-day release-age floor in sync
with `minimumReleaseAge` in `pnpm-workspace.yaml`. No Dependabot.

## Deployment (`.github/workflows/deploy.yml`)

On push to `main`, triggered by a successful CI run (`workflow_run`): `pnpm build` →
`actions/upload-pages-artifact` → `actions/deploy-pages` with
`permissions: {pages: write, id-token: write}`. Vite `base: '/currency-converter/'`.
SPA fallback via `404.html` copied from `index.html` (only needed if routing is added).

**Manual one-off:** repo Settings → Pages → Source = "GitHub Actions".

## Definition of done

Typechecks, lints, tests green · a11y clean · works offline with cached rates · no layout shift
on load · Lighthouse ≥95 across the board · bundle < 150 kB gzipped.
