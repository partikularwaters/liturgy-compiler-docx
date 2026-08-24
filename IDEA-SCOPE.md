# Idea Scope — liturgy-compiler-docx

Backfilled 2026-08-24 during Banka adoption (Section 1.5, State 2) from the
project's own pre-existing scope documents — `context/project-overview.md`,
`context/architecture.md`, and `context/build-plan.md` — which already
constituted decision-ready scope before Banka was ever applied to this
project. This file is the permanent, never-edited origin record; the source
documents it summarizes remain the live, evolving authority.

## Purpose

A web app for Reformed Life Community Church that lets a liturgist compile
Scripture, fixed liturgical formulas, and original prayer into a complete,
coherent order of worship — with a built-in bilingual Bible reader and dual
Word (`.docx`) export for both the presiding leader and the congregation.
Replaces ad hoc compilation in Docs/Sheets, where coherence lived only in the
compiler's head and successors had no record of *how* a saved verse was
meant to be used.

## Users

Reformed Life Community Church's liturgist/compiler (trusted
Curator/Compiler role, authenticated) and the wider congregation (anonymous
readers — public Home/Library/Reader/Web View pages, no login).

## Scope (v1, shipped as of 2026-07-18)

- Bible reader: AB1905 + BSB full text, self-hosted, book/chapter
  navigation, verse highlighting
- Hover preview for AB2001/MBB via licensed BibleGateway widget (no text
  extraction/storage)
- Six-part item model: Selection, Formula, Verbal Cue, Prayer, Sermon, Song
  (Psalm/Hymn), each with reusable per-Section libraries
- Fixed Morning Worship / Vesper Worship templates, computed Lord's Day
  numbering
- Dual DOCX export (Leader Guide, Congregation Bulletin) plus a shareable,
  nav-free public Liturgy Web View
- Responsive-reading formatting (Leader/Congregation/Minister/Small-Caps)
  and Prayer Guides

Out of scope for v1: Section reordering/creation, RBAC on Formula edits,
Vesper DOCX export, AB2001/MBB text storage, full Library management UI —
staged into v2/v3+ in `context/build-plan.md`.

## Constraints

- Bilingual Filipino/English content throughout — not a stylistic choice,
  a domain requirement.
- Bible-translation copyright boundary: AB1905/BSB are self-hosted (public
  domain); AB2001/MBB are display-only via a licensed widget, never
  extracted or stored, pending a Philippine Bible Society permission
  request (tracked as BA-008 in `ADOPTION-ASSESSMENT.md`).
- No paid dependency, no congregation login; free-tier hosting (Vercel
  Hobby + Supabase) with no guaranteed uptime SLA.
- Liturgical vocabulary (Selection, Formula, Verbal Cue, Prayer, Lord's Day
  number) is precise, established domain terminology — not casually
  renameable.

## Definition of done (v1)

A liturgist can start a Morning or Vesper liturgy, compile every Section
from library and freshly-authored content, and export a Leader Guide and
Congregation Bulletin as `.docx` files that match the physical bulletin's
structure — while the congregation can read the same liturgy at a
shareable public URL. This was reached and verified live in production
2026-07-18 through 2026-08-16 (see `context/progress-tracker.md`'s
Decisions Made log and `docs/PHASE-0-DATABASE-RECONCILIATION.md`).

## Open items at time of this record

- **[OPEN — needs a decision]** Whether `.docx` export in this repo
  replaces or sits alongside the original `@react-pdf/renderer` pipeline
  long-term (frozen in place for now, not removed).
- **[OPEN — needs verification]** AB2001/MBB adaptation permission request
  to Philippine Bible Society — drafted but not yet sent (BA-008).
- Full Library management (Formula delete, Scripture edit-in-place, Songs
  Library UI) — explicitly deferred to v2, not an oversight.
