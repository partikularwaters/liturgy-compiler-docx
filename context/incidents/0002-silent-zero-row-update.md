# Silent Confession language toggle: click succeeds, write is a silent no-op

## Reported

Second round on the same feature as `0001-toggle-frozen-no-catch.md`,
after that fix was live. Clicking EN on the Silent Confession rubric's
FIL/EN toggle: the button's own hover/press animation plays (so the click
is registering), but the rubric never actually changes — always reverts
to FIL, even after a hard reload. No error message shown.

## What was actually observed

Two facts, gathered by direct questions before proposing anything:

1. **A hard reload always shows FIL** — ruling out a stale client-side
   cache serving old data over a genuinely-successful write.
2. **No error message ever appears** — ruling out both failure paths
   `0001`'s fix added (a returned `{success: false}` and a caught
   rejected promise both render visible text).

Also established directly from the code before concluding anything: the
button's hover/press feedback (`hover:bg-surface-secondary`,
`motion-safe:active:scale-[0.97]`) is pure CSS (`:hover`/`:active`) and
fires regardless of whether the `onClick` handler runs or does anything —
so "the animation plays" does not, on its own, prove the Server Action
was ever called or succeeded.

## Failure mode: Mode 1 (a new, different, well-evidenced root cause)

Not the same defect as `0001` (that was a thrown/rejected promise leaving
`isSaving` stuck forever; this component shows no such symptom — it's
fully interactive on every click) and not a reproduction gap (both
diagnostic answers were concrete and decisive) and not the session having
gone wrong (one clean hypothesis, confirmed against the actual code
before any change was proposed).

**Root cause:** `setSilentConfessionLanguageAction.ts` (and, identically,
`setColumnBreakAction.ts`, `setNaturalFlowAction.ts`,
`setShowPrayerGuideAction.ts`) update the `sections` table by
`.eq("liturgy_id", liturgyId).eq("template_section_index", sectionIndex)`
and only check whether Supabase returned an `error`. Supabase/PostgREST
does **not** report an error when an `update()`'s filter matches zero
rows — it reports success with nothing changed. If the `sectionIndex`
the Compile View computes for a given render doesn't match the real
`template_section_index` stored on that liturgy's actual Section row —
the same class of index-drift this project already hit for real in
`item_types` migration work — the update silently writes to nothing.
Every symptom fits exactly: no error (a 0-row match isn't an error), the
DB genuinely never changes (explains the hard-reload result), and the
click really did fire and reach the server (explains the working
animation, though that alone was never proof of anything either way).

## Ruled out

- Stale client-side cache masking a real, successful write (hard reload
  would have shown the true state; it didn't).
- The `0001` failure class recurring (no frozen/disabled-forever
  behavior reported; the button remains fully clickable across repeated
  attempts).
- `getCurrentUser()` being broadly broken (other mutations in the app
  are not reported as failing).

## Fix applied

Added `.select("id")` to all four actions' `update()` calls and check
the returned row count: zero rows now returns an explicit
`{success: false, error: "Couldn't find that Section -- try reloading
the page."}` instead of a false `{success: true}`. Updated
`mutationAuthorization.test.ts`'s mock chain to include the new
`.select()` step.

## Still open

The theory that a real `template_section_index` mismatch exists on the
specific Production liturgy being tested is the best-fitting explanation
available, but was not directly confirmed against that liturgy's actual
row (no Production DB access from this session). This fix converts the
silent no-op into a visible, actionable error either way — the next
attempt will either surface that exact error (confirming the theory) or
succeed outright (meaning something about the underlying data changed
since, or the mismatch was transient). If the error appears, the real
fix is correcting whatever produced the wrong `sectionIndex`/
`template_section_index` pairing for that liturgy, not this file.
