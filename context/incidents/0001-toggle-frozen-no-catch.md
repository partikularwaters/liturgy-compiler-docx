# Compile View toggles freeze silently on a thrown Server Action error

## Reported

Two users, both in Production, clicking EN on the Silent Confession
rubric's FIL/EN toggle (`components/liturgy/SilentConfessionLanguageToggle.tsx`):
the button did not respond at all — no error, no state change, no visible
effect of any kind. Reported as "frozen."

## What was actually observed

This surfaced across two rounds of the same underlying issue in one
session:

1. First report: clicking EN reverted silently to FIL, no error shown.
   Traced to every Compile View toggle handling only the *resolved*
   `{success: false}` case from its Server Action call, with no `else`
   branch — a real gap, fixed in commit `5dc6eef` (added `error` state +
   inline message to `SilentConfessionLanguageToggle.tsx`,
   `NaturalFlowToggle.tsx`, `PrayerGuidePanel.tsx`, and
   `LiturgyOptionsMenu.tsx`'s Mark as Ready).
2. Confirmed via GitHub's Vercel deployment status API that `5dc6eef`
   deployed successfully (`"Deployment has completed"`, 2026-09-12
   09:52 UTC) — ruling out "the fix never shipped."
3. Second report, after that fix was live: the button still didn't
   respond, described as "frozen" rather than "reverts silently" — a
   materially different symptom. Grepped every `.then((result) => {...})`
   call site in `components/` for a matching `.catch()` and found **zero**
   across all 15 files that call a Server Action this way, including the
   4 just "fixed" in `5dc6eef`.

## Failure mode: Mode 1 (targeted, findable root cause)

Not a reproduction gap — the deploy-status check and the exhaustive grep
both confirmed a concrete, systemic code defect, not an environment or
timing mystery.

**Root cause:** every one of these components only chains `.then()` on its
Server Action call, with no `.catch()`. If the action's promise *rejects*
(throws) instead of *resolving* to `{success: false}`, `.then()` never
runs at all — `setIsSaving(false)` never executes, so the triggering
control (button/checkbox/menu item) stays permanently disabled. This
reads exactly as "frozen": no error, no revert, no further response to
clicks, because the component's own loading-state guard (`if (isSaving)
return`) now blocks every future click forever.

The most likely real-world trigger, given two independent users hit it
the same day two deploys shipped: a Next.js Server Action reference bound
to a page bundle from *before* a deploy throws when called against
the *new* deployment's server code — a well-known Next.js/Vercel failure
mode for any tab left open across a deploy.

## Ruled out

- The `sections.silent_confession_language` column, its `NOT NULL`
  default, and its check constraint: a raw `UPDATE`/`SELECT` round-trip
  via `docker exec supabase_db_liturgy-compiler-docx psql` succeeded
  cleanly against real Morning and Vesper liturgies. Not a schema/DB
  issue.
- `getCurrentUser()` (`lib/auth/getCurrentUser.ts`) being broadly broken —
  if it were, every mutation in the app would fail identically, not just
  this one family of components.
- The `5dc6eef` fix not being deployed — confirmed live via GitHub's
  Vercel status check on that commit.

## Fix applied

Added `.catch()` to all 15 call sites (not just the 4 touched in
`5dc6eef`), each setting the loading flag back to `false` and showing
"Something went wrong -- try again." — so a thrown error now behaves the
same as a returned `{success: false}`: the control un-freezes and the
user sees a message, instead of a permanently disabled control with zero
feedback.

Full file list: `SilentConfessionLanguageToggle.tsx`, `NaturalFlowToggle.tsx`,
`PrayerGuidePanel.tsx`, `LiturgyOptionsMenu.tsx`, `EndNoteToggle.tsx`,
`SectionCard.tsx` (8 handlers), `AddSongPanel.tsx`, `AddPrayerPanel.tsx`,
`AddExistingSelectionPanel.tsx`, `AddLibraryItemModal.tsx` (3 forms),
`VesperReadingPanel.tsx`, `SongListRow.tsx`, `PrayerListRow.tsx`,
`FormulaListRow.tsx`, `ScriptureSelectionRow.tsx`.

Not done: a shared helper/hook to consolidate this pattern so a future
new component can't reintroduce it. Flagged as worth considering, out of
scope for this fix.

## Still open

Whether the actual trigger really was a stale-Server-Action-reference
tab is not confirmed — no way to verify that specific mechanism after
the fact from this session. If the "frozen" symptom recurs after this
fix, that would rule out the stale-reference theory and point at a
different, still-unidentified thrown-error source worth its own
follow-up diagnosis.
