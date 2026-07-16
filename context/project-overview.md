<!-- Project overview: what you're building, why, and who it's for -->

# Project Overview

## About the Project

A web application for Reformed Life Community Church that lets a liturgist compile Scripture, fixed liturgical formulas, and original prayer into a complete, coherent order of worship — with a built-in Bible reader, and dual PDF export for both the presiding leader and the congregation.

---

## The Problem It Solves

Liturgy is currently compiled in Docs/Sheets with no unified view of the whole service while writing it, and no record of *how* a saved verse is meant to be used (line divisions, adapted wording, surrounding fixed formulas). The result: coherence lives only in the compiler's head, and successors default to reusing prior choices rather than choosing on purpose. This app makes the whole liturgy visible while compiling it, and makes every piece of text carry its own usage record.

---

## Pages

```
/                        → Homepage: hero line, "Create Liturgy" / "Browse Library" CTAs, recent-liturgies preview
/liturgies               → Liturgy Compiler page: full Liturgy History list + "New Liturgy" CTA (v1's old dashboard, moved here)
/reader                  → Bible reader: browse book/chapter, highlight, save Selections
/liturgy/new             → Start a liturgy: pick Morning/Vesper template + date (Lord's Day auto-computed)
/liturgy/[id]            → Compile view: all Sections of the chosen template, 2-page/3-column layout, items per Section
/liturgy/[id]/export     → Generate Leader Guide / Congregation Bulletin PDFs — Morning only in v1 (see Vesper note below)
/liturgy/[id]/view       → Vesper's public, mobile-first responsive Liturgy Web View — shareable by URL, replaces PDF for Vesper in v1
/library                 → Browse Library: Formulas, Prayers (+ Prayer Guides), Songs (Psalm/Hymn), Existing Selections — one merged page, superseding the old separate /formulas and /prayers
```

One route per distinct user activity — reading, compiling, exporting, managing reusable libraries. **v1.1 change:** the dashboard/history list moved from `/` to `/liturgies`, since `/` is now a proper marketing-style homepage; `/formulas` and `/prayers` were merged into one `/library` page rather than staying separate.

---

## Navigation

**v1.1 change — reverses the original "no top navbar" decision.** A single top bar replaces the left sidebar: **Liturgies** · **Bible Reader** · one contextual CTA slot that reads **Create Liturgy** on the homepage and swaps to **Browse Library** while inside the Liturgy Compiler page. No Sign In/Account item in v1 (that arrives with v3 auth). See `ui-rules.md` for the bar's visual spec and `context/redesign-plan-v1.1.md` §A for the full reasoning.

---

## Core User Flow

### Flow 1 — Starting a Liturgy

User opens `/liturgy/new`, selects Morning Worship or Vesper Worship, picks a date via calendar. Lord's Day number computes automatically (count of Sundays since the first Sunday of that calendar year, no skips). **v1.1:** picking a non-Sunday date shows a warning immediately and again beside the Start button; the user must click "Proceed anyway" to save it, and the resulting liturgy never displays a Lord's Day number (LD# is only ever shown for a date that's actually a Sunday). User lands on the compile view with all Sections of the chosen template empty, laid out across 2 pages of 3 columns each (both templates share this editing layout).

### Flow 2 — Compiling a Section

User browses the Bible reader (AB1905 or BSB, full text) or hovers a reference elsewhere in-app to preview AB2001/MBB via the BibleGateway widget. To add a Selection: highlight a passage in the reader, assign it to a Section — reference and citation tag auto-fills; the reader immediately shows a marker on any citation already used in that Section (dedup blocks an exact-match re-add), and every submitted Selection also joins the reusable Scripture Text Library regardless of whether the liturgy itself is ever saved. To add a Formula, Verbal Cue, Prayer, Psalm, or Hymn: pick an existing library entry or write a new one inline from `/library`, which joins the relevant library for future reuse (Formula stays a singular reusable entity with an editable default, not a library of variants; Prayer, Psalm/Hymn, and now Selection are all library-backed). **v1.1:** which of these item types a given Section even offers is now restricted per-Section (e.g. the five dynamic song Sections only offer Psalm/Hymn, never Selection) — see `context/redesign-plan-v1.1.md` §Y for the full mapping. Most Sections also offer a default Verbal Cue pre-filled from a per-Section bilingual sample script, auto-substituting real values (title/citation) already added to that Section.

### Flow 3 — Exporting

Once a Morning Worship liturgy is compiled, `/liturgy/[id]/export` generates two PDFs from the same data: the Leader Guide (every item, including leader-only Verbal Cues) and the Congregation Bulletin (everything except leader-only Verbal Cues), both in the same 2-page/3-column layout as the Compile View. **Vesper liturgies use `/liturgy/[id]/view` instead** — a shareable, mobile-first responsive web page — since no physical Vesper bulletin has ever existed; Vesper's PDF export is deferred to v3/v4.

---

## Data Architecture

### Liturgy
- Lives in Postgres (Supabase), one row per compiled service instance
- Changes each time a Section's items are added, edited, or reordered within v1's fixed structure
- Used for: compiling, history, both PDF exports
- Must never be silently overwritten by editing a Formula's master default (see Formula below)

### Template
- Two fixed rows in v1: Morning Worship, Vesper Worship — each an ordered list of Section definitions (name, posture asterisk, dynamic Psalm/Hymn naming rule where applicable)
- Changes only in v2, when Sections become user-editable

### Section
- Belongs to a Liturgy, corresponds to one Template slot (e.g., "Confession of Sin")
- Holds an ordered list of Items

### Item
- One of: **Selection** (citation-tagged, markdown text, dedup on exact citation match within its Section — text is optional for a handful of long-reading Sections, which store only the citation), **Formula** (references a reusable Formula entity, may carry a per-instance override), **Verbal Cue** (freely editable inline, carries the leader-only visibility flag, defaults to a per-Section sample script), **Prayer** (references or creates an entry in that Section's Prayer library), **Psalm** and **Hymn** (v1.1 — reference-only sung content, no body text stored; share one "Songs" library tagged by kind). A per-Section item-type whitelist (v1.1) restricts which of these a given Section actually offers — see `context/redesign-plan-v1.1.md` §Y.
- Selection, Formula, and Prayer text can also carry structured Leader/Congregation/Minister span tags (v1.1) on a handful of Sections, for responsive-reading formatting — stored separately from the raw text, never baked in.

### Formula (library)
- Stored once per named Formula (e.g., "Absolution"), scoped to exactly one Section name, with an editable default
- Placing it into a Liturgy either uses the default or records an override for that instance — the master default is not changed by a one-off edit

### Prayer (library)
- Per-Section collection of prior entries (e.g., 2–3 existing Confession of Sin prayers) — picked, edited, or added to, no canon status
- v1.1 adds a `guide` variant in the same library — a fixed structural checklist (e.g. Invocation's Adoration → Humble Approach → Acceptance → Thanksgiving → Trinitarian Conclusion) shown as reference next to "Add Prayer" on Sections that have one, not stored as liturgy content

### Songs — Psalm and Hymn (library, v1.1)
- One shared library, tagged by kind (`psalm` | `hymn`), scoped per-Section like Formula/Prayer
- Psalm: title/reference, versification, year published, notes. Hymn: title, author, year published, notes. Neither stores lyric/body text
- Congregation-facing output shows the title only (Psalm: title case, italic, red; Hymn: title case, italic); Leader Guide shows full metadata

### Scripture Text Library ("Existing Selections", v1.1)
- Every Selection submitted via the Reader's marker joins this library automatically, scoped per-Section, regardless of whether the liturgy itself is ever saved
- No cleanup logic in v1 — orphaned entries from abandoned liturgies are accepted as a known tradeoff

---

## Features In Scope

- Bible reader: AB1905 + BSB, full text, book/chapter navigation, verse highlighting
- Hover preview for AB2001/MBB via BibleGateway's RefTag/BGLinks widget (licensed display, not extracted text)
- Selection creation with citation tagging and exact-match dedup per Section; every submitted Selection also joins a reusable Scripture Text Library (v1.1)
- Six-part item model: Selection, Formula, Verbal Cue, Prayer, Psalm, Hymn (Psalm/Hymn added v1.1) — restricted per-Section by an item-type whitelist (v1.1)
- Fixed Morning Worship / Vesper Worship templates, posture shown as a trailing asterisk, dynamic Psalm/Hymn Section naming; Morning's "Charge & Benediction" splits into two Sections (v1.1)
- Computed Lord's Day numbering (auto, resets each January, never skips); non-Sunday dates require explicit confirmation and never display an LD# (v1.1)
- Liturgy history, with a dedicated homepage separate from the full list (v1.1)
- Morning: dual PDF export (Leader Guide, Congregation Bulletin) from one compiled Liturgy, 2-page/3-column layout matching the physical bulletin (v1.1 — was single-column)
- Vesper: a shareable, mobile-first responsive Liturgy Web View, in place of PDF export (v1.1)
- Leader/Congregation/Minister responsive-reading tool with structured text spans, on a handful of Sections (v1.1)
- Prayer Guides — fixed structural checklists for extemporaneous prayers, shown as reference on Sections that have one (v1.1)

## Features Out of Scope (v1)

- Section reordering, renaming, or creation beyond the one-time Morning Charge/Benediction split — v2
- Verse tags, coherence score, universal search, cross-day duplicate flagging — v3+
- Reformed Life PowerPoint Builder integration — v3+
- Role-based access control on Formula edits — v3+ (item-type groundwork laid now)
- Automated rotation-cycle assignment for Vesper's recurring readings — v3+ (v1.1 keeps this a manual, handbook-referenced lookup)
- Vesper's PDF export (Guide/Bulletin) — deferred to v3/v4; Vesper uses the web view instead in v1.1
- An MBB hover-preview toggle alongside AB2001 — the widget only supports one active translation at a time; a real toggle needs its own design work, not scoped yet
- Extraction/storage of AB2001 or MBB text into the app's own database — pending Philippine Bible Society response; hover-widget display only until then

---

## Tech Stack

- **Frontend:** Next.js
- **Backend:** Next.js (API routes / server actions)
- **Database:** Supabase (Postgres), hybrid schema — relational tables for Liturgies/Templates/Formulas, structured JSON for Items within a Section
- **Auth:** None in v1 (single user); Supabase Auth available when v3's access control is built
- **PDF export:** @react-pdf/renderer — Morning only in v1.1, rebuilt to the 2-page/3-column layout; Vesper uses the new web view instead
- **Styling:** Tailwind CSS v4
- **Bible text:** AB1905 + BSB self-hosted/API for the reader; BibleGateway RefTag/BGLinks widget for AB2001/MBB hover preview

---

## Analytics Events

None in v1 — solo-user internal tool, no audience for engagement/growth metrics.

---

## Target User

John Madrid (solo build and initial use), and eventually the RLCC roles who prepare or lead worship — presider, deacon, preacher — compiling Morning or Vesper liturgies.

---

## Success Criteria

- Madrid personally compiles a real Sunday liturgy end to end — selecting/adapting Scripture, assigning Selections/Formulas/Verbal Cues/Prayers to Sections, across either template
- Both Leader Guide and Congregation Bulletin PDFs export correctly from that one compiled liturgy in a single sitting
