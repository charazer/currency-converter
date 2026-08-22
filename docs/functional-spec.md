# Functional Spec

## Core flow

1. Load → restore last pair from `localStorage`, else guess from locale (`de-DE` → EUR) else EUR→USD.
2. Fetch currency list + all rates for the base currency.
3. User types in either amount field; the other updates live (debounce 0 — it is local math).
4. Swap button exchanges base/quote and re-uses the cached rate (inverse) until the new base loads.
5. Rate line: `1 EUR = 1.1568 USD · rates from 21 Aug 2026`. Stale/offline data says so explicitly.

Both amount fields are editable and symmetric. Conversion direction follows whichever field has focus.

## Number formatting (the headline feature)

**Display**: `Intl.NumberFormat(locale, { style: 'decimal', minimumFractionDigits: d, maximumFractionDigits: d })`
where `d` = the currency's ISO minor unit (2 default; 0 for JPY/KRW/CLP…; 3 for BHD/KWD/OMR…),
derived from `Intl.NumberFormat(locale, {style:'currency', currency}).resolvedOptions()`.

**Live grouping while typing** — the input is a text field, not `type="number"`:

- On every keystroke: strip group separators, validate against the locale grammar, reformat the
  integer part with group separators, leave the fraction part _exactly as typed_.
- Preserve a trailing decimal separator and trailing zeros while the field has focus
  (`1.` and `1.50` must not be eaten). Normalise to full precision on blur.
- Restore the caret by counting significant digits before it, not raw string offset.
- Accept both `.` and `,` as decimal separator on input, plus space/NBSP/`'` as ignorable group
  separators. The locale's **own group character is always grouping**, never a decimal point —
  otherwise editing inside an already-grouped value (`1,2934` in en-US) is misread. Where two
  different separators appear, the last one is the decimal, so a pasted `1.234,56` still resolves.
- Reject: multiple decimal separators, letters, `-` (no negative money), and any keystroke that
  would push the value past 15 digits (the field simply refuses it and the UI shows a hint).
- Leading zeros are **preserved while typing** and normalised on blur. Rejecting them mid-keystroke
  would block a user who types `0` before `1`.
- Parsing never adds or removes digits, only reinterprets separators. This invariant is what makes
  caret restoration exact.
- Locale-aware output only via `Intl` — never hand-roll separator tables.
- Handle non-Latin numbering systems (`ar-EG` ٫ / `hi-IN-u-nu-deva`) by mapping digits through the
  locale's `formatToParts` output; and Indian grouping (`en-IN` → `12,34,567.89`) comes free with `Intl`.

**Locale source**: `navigator.language`, overridable in the UI (a short list + "system default"),
persisted to `localStorage`.

## Precision

- All conversion via `Decimal`: `target = amount.times(rate)`, round half-up to the target
  currency's minor units for display; keep full precision in state.
- Rates display with 4–6 significant decimals, never truncated to 2.
- Very large inputs: capped at 15 digits; the keystroke is refused rather than silently mangled.

## Extras

| Feature         | Behaviour                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------- |
| Currency select | Searchable combobox over code + name; matches on either; favourites pinned on top               |
| Favourites      | Star toggles the current pair; list of ≤8, click to load, persisted                             |
| Chart           | 30 / 90 / 365-day toggle, `GET /rates?from&to`, SVG line, min/max/current labels, hover readout |
| Theme           | `light` / `dark` / `system`, persisted, `color-scheme` + `prefers-color-scheme`                 |

## States

Loading (skeleton, inputs disabled but visible) · Error (message + retry, keeps last good rate) ·
Offline (cached rates + "last updated" badge) · Unsupported pair (404 → clear message, no crash).

## Non-goals

Fees, spreads, historical conversion at a chosen past date (chart is read-only), crypto, transfers.
