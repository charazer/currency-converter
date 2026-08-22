import { z } from 'zod'

// Zod compiles validators with `new Function` unless told otherwise, which our CSP blocks. The
// probe is caught and falls back safely, but it logs a violation on every load. Importing `z` from
// here rather than from `zod` guarantees the setting is applied before any schema is constructed.
z.config({ jitless: true })

export { z }
