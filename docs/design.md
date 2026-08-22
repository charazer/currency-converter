# Design

## Principles

- One screen, one job. Nothing above the fold except the converter.
- Numbers are the interface — largest type in the app, tabular figures, generous spacing.
- Progressive disclosure: chart, favourites and locale settings sit below/behind the fold.
- Motion is functional only (swap, value change) and respects `prefers-reduced-motion`.

## Layout

Centred card, max-width `40rem`, vertically centred on desktop, top-aligned on mobile. The amount
type scales down once a value passes ~11 characters so long figures never reach the field edge. The
currency listbox is wider than its trigger and flips above it when there is no room below.

```
 [ Currency Converter        ☆  ◑ ]
 ┌──────────────────────────────┐
 │ From        [ EUR  ▾ ]       │
 │ 1,234,567.89                 │   ← large, grouped, editable
 ├───────────── (⇅) ────────────┤
 │ To          [ USD  ▾ ]       │
 │ 1,427,957.68                 │
 └──────────────────────────────┘
 1 EUR = 1.1568 USD · 21 Aug 2026
 [ 30D  90D  1Y ]   ╭─╮ sparkline
```

Single column throughout; the swap control sits on the divider between the two fields.

## Tokens (`styles/tokens.css`)

- Colour: semantic vars only (`--bg`, `--surface`, `--text`, `--text-muted`, `--accent`, `--border`,
  `--danger`), redefined under `[data-theme='dark']`. Accent: a single restrained blue-violet.
- Type: system font stack; `font-variant-numeric: tabular-nums` on every number.
  Scale `0.75 / 0.875 / 1 / 1.25 / 2.25rem`; amounts at the top of the scale, `clamp()`ed for mobile.
- Space: 4px base, `--space-1..8`. Radius `--radius-sm|md|lg` (8/12/16px). One soft shadow only.
- Dark mode is the _default_ if the system prefers it; both themes get real contrast checks.

## Interaction

- Amount fields: `inputmode="decimal"`, `autocomplete="off"`, select-all on focus.
- Swap: rotates the icon 180°, cross-fades values.
- Value change: brief highlight on the non-focused field so it's clear what updated.
- Currency select: native-feeling combobox, keyboard-first (type to filter, ↑↓, Enter, Esc).

## Accessibility

- WCAG 2.2 AA. Visible focus rings (`:focus-visible`), 4.5:1 text contrast, 44px touch targets.
- Combobox implements the ARIA APG combobox pattern; no `div`-buttons.
- Converted value announced via `aria-live="polite"` (debounced ~400ms to avoid chatter).
- Full keyboard operation; screen-reader label includes the currency name, not just the code.
- Works at 200% zoom and with `prefers-reduced-motion` / forced-colors.
