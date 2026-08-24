# Banka Feedback: Session-State File Bloat (Standard Tier)

**Source project:** `liturgy-compiler-docx` (Standard tier, adopted 2026-08-24)
**Filed by:** Claude Code session, 2026-08-24, at Madrid's explicit request
**Audience:** a Banka-repo session evaluating protocol changes — this is a
proposal to discuss, not a change already made to Banka itself.

---

## 1. Problem

`context/progress-tracker.md` — Standard tier's designated session-state
file — grew to **320KB / 869 lines** over roughly six weeks of active
development. It is read in full on every `/remember restore`, and is one of
the files `AGENTS.md`'s Source of truth section tells a session to consult
before acting.

This is not specific to this project's file naming. The same failure mode
applies to any tier's session-state destination: Minimal's Banka-owned
`AGENTS.md` block, Core's `core/progress.md`, and Standard's
`progress-tracker.md` are all designed as flat, ever-appending logs with no
built-in bound on size. A project with sustained development activity will
eventually hit this regardless of tier.

## 2. Assessment

The bloat has one clear cause: **the file conflates two different kinds of
content that have very different lifespans.**

- **Settled facts** — what was decided, and why. These stay relevant
  indefinitely but are naturally compact (a decision log entry is a sentence
  or two).
- **Narrative** — the session-by-session story of *how* something was built:
  debugging blow-by-blow, direct quotes, iteration rounds, dead ends. This
  has real short-term value while work is active (exactly what `remember`
  is designed to capture), but its value drops sharply once the work ships
  and the file's own settled-facts section already carries the conclusion
  forward.

Because both kinds of content live in one growing file with no split and no
size-based trigger, narrative accumulates indefinitely. Nothing in the
`remember` skill's save-mode instructions, nor anything in `scale` (which
governs tier *promotion*, not within-tier file management), currently
addresses this. `linis` addresses *prose quality* (removing direct quotes,
narrative dates, storytelling) but is scoped by design to "files changed in
the current completed milestone" — it was not built to solve *volume* on an
already-bloated file, and running it repo-wide against a 320KB file with six
weeks of build history in one pass is a much bigger, riskier ask than what
`linis`'s Context Contract anticipates.

**Standard tier is a real aggravating factor here.** It's the tier with the
most session-state surface area (no ceiling above it in the current tier
ladder) and the one most likely to accumulate months of history without a
forcing function to reorganize.

## 3. Immediate fix (applied to this project, not yet a Banka change)

Split `progress-tracker.md` into a lean live file plus dated/versioned
archive files:

- **Live file** keeps every current-state section (Completed / In Progress /
  Up Next / Blocked / Known Issues) plus **Decisions Made in full** — this
  section is the settled-facts ledger and is what actually answers "why is
  it built this way" for a new session, without needing the narrative at
  all. Session Notes trimmed to the recent, still-operationally-relevant arc
  only.
- **Archive files**, chunked by project phase/version (not by calendar date
  — phase boundaries are how a future session would actually search:
  "why does Feature 21 work this way" points at the v1.1 archive, not
  "July 16"). Each archive carries its own short Contents list at the top.
- **The live file gained a short Archive Index** naming each archive file,
  what it covers, and the explicit instruction: *grep on demand, never read
  wholesale, never touch on a default `/remember restore`.*
- The cutoff was chosen as "everything before the most recent active work
  arc" — in this project's case, the day the current stabilization/adoption
  work began — so the live file keeps exactly what's still relevant to
  present decisions and nothing older.
- `linis` was run against the archive content only (not the live file) as a
  light-touch pass — this was tractable specifically *because* the content
  was already isolated into three smaller, phase-scoped files instead of one
  320KB blob.

Result: the live file dropped from 320KB to **~56KB** (an ~82% reduction),
with zero loss of historical record — everything moved, nothing was deleted.

This was a manual, one-off intervention this session. It is not a Banka
mechanism — nothing about it is documented in Banka's protocol, so it won't
happen automatically on any other project, and there's no guidance telling a
future session on *this* project when to do it again next time the live file
regrows.

## 4. Proposal (open for discussion, not prescribed)

Rather than propose a single fix, here are the shapes a Banka-level answer
could take — evaluate against Banka's own goals (truthful, minimal-ceremony,
tier-appropriate) rather than treating this as a spec:

- **A documented archival pattern for Standard tier**, analogous to `scale`'s
  tier-promotion mechanism but operating *within* a tier: a threshold (file
  size, or session-count, or a manual trigger) that prompts splitting
  settled narrative out of the live session-state file into dated/versioned
  archive files, with a required Archive Index left behind. This could be a
  new skill (a `scale`-adjacent sibling, not a `scale` responsibility since
  no tier promotion is involved) or an documented extension of `remember`'s
  save-mode instructions.
- **A `remember` save-mode change**: explicitly separate "settled fact"
  writes (append to Decisions Made / Known Issues, small and permanent) from
  "narrative" writes (append to Session Notes, explicitly framed as
  eligible for future archival) at write time, rather than trying to
  disentangle them later from one flat log.
- **A `linis` scope extension**: an explicit "bloat mode" or higher-level
  invocation that's allowed to operate against a whole file (or repo-wide)
  rather than only the current milestone's diff, specifically for this
  archive-then-clean workflow — with its own stronger safety rails given the
  larger blast radius.
- **Do nothing structurally, document the pattern instead**: add a
  recommended-practice note to the Standard-tier skill docs (`remember`
  and/or `AGENTS.md`'s own template) describing this exact split-and-index
  approach as an ad hoc technique a session can apply when a project's
  session-state file gets unwieldy, without making it a first-class Banka
  mechanism. Lower cost to build, but leaves every project reinventing the
  same fix independently — as this project just did.

No recommendation is made here on which of these is right — that's exactly
the kind of protocol-design judgment call that belongs in a Banka-repo
session, not baked into a single project's feedback file.
