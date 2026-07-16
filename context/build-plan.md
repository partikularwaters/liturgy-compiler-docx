<!-- Build plan: features broken into phases with clear done criteria -->

# Build Plan

## Core Principle

Full-page UI built with mock data first, verified visually before any logic is written. Then functionality is built and wired step by step. Every feature must be visible and testable before moving to the next — no invisible backend phases.

---

## Phase 1 — Bible Reader Foundation

### 01 Reader UI (mock data)

Book/chapter navigation and verse display for the Bible reader, with mock text standing in for AB1905/BSB.

**UI:**

- Book and chapter picker
- Verse display pane
- Highlight color picker + applied-highlight rendering

---

### 02 Reader Logic

Wire the Reader to real text.

**Logic:**

- `lib/bible` provider abstraction implemented; AB1905 and BSB wired in as real providers
- Highlight state persisted per verse

---

## Phase 2 — Liturgy Creation & Compile View

### 03 New Liturgy Flow — UI

Template and date selection screen, with mock Lord's Day number.

**UI:**

- Morning Worship / Vesper Worship template picker
- Date picker with Lord's Day number displayed (mock)

---

### 04 New Liturgy Flow — Logic

**Logic:**

- Real Lord's Day computation (count of Sundays since first Sunday of the calendar year, no skips)
- Creates a real `liturgies` row plus its `sections` rows from the chosen `templates` row

---

### 05 Compile View — UI (mock data)

The full liturgy compile screen — every Section of the chosen template, empty item slots, posture and naming rules visible.

**UI:**

- Ordered list of Sections for the chosen template
- Posture shown as trailing asterisk on Section title
- Dynamic Psalm/Hymn prefix rendering for song Sections
- Empty-state item slots per Section

---

### 06 Compile View — Logic

**Logic:**

- Sections and their Items loaded from and saved to Postgres
- Section item list re-renders live as items are added/edited

---

## Phase 3 — Item Types

### 07 Selection — Reader-to-Section

Connecting the Reader to the Compile View.

**UI:**

- "Add to Section" action from a highlighted passage in the Reader
- In-reader marker showing a citation already saved to a Section

**Logic:**

- Citation tag auto-filled from the reference; dedup check blocks exact-match re-add within the same Section
- Manual text entry path for partial/non-contiguous/adapted Selections, still citation-tagged

---

### 08 Formula Library

**UI:**

- Formula list (`/formulas`), create/edit a Formula's default text
- Place a Formula into a Section, with optional per-instance override text

**Logic:**

- Editing a Formula's default never retroactively changes a Liturgy that used an override
- `access_level` field present on the schema, unused in v1 (v3 groundwork)

---

### 09 Verbal Cue

**UI:**

- Inline add/edit for Verbal Cue text within a Section
- Leader-only visibility toggle

**Logic:**

- Visibility flag drives inclusion/exclusion in the Bulletin export (Phase 4)

---

### 10 Prayer Library

**UI:**

- Per-Section prayer list — pick an existing entry, edit one, or write a new one
- New entries join that Section's library automatically

**Logic:**

- No canon status, no access restriction — any edit or addition saves directly

---

## Phase 4 — Export & History

### 11 PDF Export — Leader Guide

**Logic:**

- All items in the compiled Liturgy rendered via @react-pdf/renderer, single-column

---

### 12 PDF Export — Congregation Bulletin

**Logic:**

- Same compiled Liturgy, leader-only Verbal Cues excluded

---

### 13 Liturgy History

**UI:**

- Dashboard (`/`) listing past and in-progress liturgies by date/Lord's Day number

**Logic:**

- Opens any past Liturgy back into the Compile View

---

## Phase 5 — Hover Preview

### 14 AB2001/MBB Hover Widget

**UI:**

- BibleGateway RefTag/BGLinks widget integrated wherever a Scripture reference appears in-app

**Logic:**

- Display-only — no AB2001/MBB text fetched or stored in this codebase

---

---

# v1.1 Redesign

Fully scoped and approved 2026-07-16 — see `context/redesign-plan-v1.1.md` for the complete decision record this phase breakdown summarizes. Not yet implemented. Follows the same Core Principle as v1: mock-data UI pass before logic, one feature complete before the next.

## Phase 6 — Shell & Compile View Redesign

### 15 Navigation & Homepage

**UI:**

- Top bar (Liturgies · Bible Reader · contextual CTA) replaces the Sidebar
- New Homepage at `/` — hero line, Create Liturgy/Browse Library CTAs, recent-liturgies preview
- Liturgy Compiler page at `/liturgies` — full Liturgy History list + New Liturgy CTA, moved from the old `/`

**Logic:**

- Contextual CTA swaps label/destination based on route (Create Liturgy on homepage → Browse Library elsewhere)

### 16 Liturgy Naming & Non-Sunday Dates

**UI:**

- New naming convention in Liturgy History: `Lord's Day # | Worship Type | Sermon Text | Date`
- Non-Sunday date warning on selection, repeated beside the Start/Save button, requiring "Proceed anyway"

**Logic:**

- Minimal Sermon `passage` field (full title/preacher deferred)
- `getLordsDayNumber()` computation unchanged; LD# display suppressed everywhere for a non-Sunday liturgy — invariant, never recalculated/reassigned

### 17 Compile View 2-Page/3-Column Layout

**UI:**

- Both templates' Compile View rebuilt to 2 pages × 3 columns, per the fixed Section→column assignment (`redesign-plan-v1.1.md` §F)
- Morning's Charge & Benediction Section splits into two separate Sections

**Logic:**

- `templates.sections` gains `page`/`column` fields
- Morning's PDF export (`lib/pdf/`) rebuilt to match the 2-page/3-column shape
- Careful migration of the one real existing liturgy when the Charge/Benediction split lands — recheck live liturgy count first, re-index `template_section_index` correctly, don't assume a clean insert

### 18 Vesper Liturgy Web View

**UI:**

- New public, mobile-first responsive page at `/liturgy/[id]/view`

**Logic:**

- Reads the same compiled-liturgy data as the PDF path, no separate data model
- No PDF generated for Vesper in v1 — deferred to v3/v4

### 19 Reader & Marker Redesign

**UI:**

- Sticky Citation/Text panel (reading column narrows to open left-margin space)
- Success message repositioned below the Citation/Text panel (was above)
- Marker redesign: red "+" in a yellow box (addable), green circle superscript (saved, no longer an interactive button)

**Logic:**

- Presentational only — no change to the underlying Selection-save flow

---

## Phase 7 — Content Model

### 20 Browse Library & Scripture Text Library

**UI:**

- New merged `/library` page (Formulas, Prayers + Guides, Songs, Existing Selections), replacing the separate `/formulas` and `/prayers` pages

**Logic:**

- New `scripture_selections` table — every Selection submission auto-joins it, Section-scoped, regardless of whether the parent liturgy is ever saved
- No retention/cleanup logic in v1 (flagged for a future manual tool)

### 21 Psalm & Hymn Item Types (Songs Library)

**UI:**

- New "Add Psalm"/"Add Hymn" pickers on the 5 dynamic song Sections, entirely replacing Add Selection there

**Logic:**

- New `songs` table — shared library, tagged by kind (`psalm` | `hymn`), Section-scoped
- Leader Guide shows full metadata (title, versification/author, year, notes); Bulletin shows the styled title only

### 22 Reference-Only Selections & Section Content Corrections

**Logic:**

- `SelectionItem.text` becomes genuinely optional for long-reading Sections (The Lord's Discourses, Words of Institution, Closing of the Table) — citation only, no body text
- Section-specific corrections per `redesign-plan-v1.1.md` §N–T: Confession of Sin (Morning) → Prayer; Doxology (both) → Hymn; Assurance of Pardon/Charge/Benediction/Great Commission → Selection + Formula with the Minister role tool
- The Lord's Table (Vesper) → heading + administrator-name field only, no item picker
- Prayer Meeting (Vesper) → heading only, nothing under it

### 23 Per-Section Item-Type Whitelist

**Logic:**

- `templates.sections` gains `item_types` — "Add X" buttons only render for a Section's whitelisted types, across both templates
- Closes the long-deferred "per-Section item-type restriction" gap noted since Phase 3

### 24 Citation Typography

**UI:**

- Universal small-caps Scripture citation styling with a new dedicated red token, distinct from `--color-error`
- Psalm titles get the same red treatment (congregation-facing); Hymn titles don't (not Scripture)

**Logic:**

- New `--color-citation` / `--color-cta-yellow` tokens (`ui-tokens.md`)

### 25 Leader / Congregation / Minister / Small Caps Tool

**UI:**

- Span-tagging tool on Call to Worship, Prayer of Invocation (both templates), and the Church Covenant portion of Affirmation of Faith/Church Covenant (Vesper) — Leader/Congregation/Minister speaker labels plus manual Small Caps marking for the Divine Name
- Minister role further restricted to Assurance of Pardon, Charge, Great Commission, Benediction

**Logic:**

- New `marks` field (structured span tags) on Selection/Formula items — never baked into raw saved text; un-marking must be lossless
- `**bold**` markdown remains the live option everywhere this tool doesn't apply

### 26 Verbal Cue Defaults & Rubric

**UI:**

- Default pre-filled Verbal Cue at the start of every Section except an explicit per-template exclusion list (`redesign-plan-v1.1.md` §V.1)
- Placeholder auto-substitutes real values (title/citation) already added to that Section, from a per-Section bilingual sample script
- Rubric-styled Verbal Cue variant (Sentence case, italic) for Confession of Sin's (Morning) ending instruction

**Logic:**

- Per-Section sample-script lookup — code-level constant, not a DB table (doesn't vary per liturgy)

### 27 Prayer Guides & Amen Rule

**UI:**

- `guide`-kind Prayer library entries, shown as a reference panel next to "Add Prayer" on the Sections listed in `redesign-plan-v1.1.md` §W
- Amen Rule indicator (does this song customarily end in a sung Amen) — Leader Guide only, never the Bulletin

**Logic:**

- `prayers` gains a `kind` column (`prayer` | `guide`)
- Amen Rule is a per-Section/per-song-slot code-level lookup, not stored liturgy data

### 28 Morning Compile View Visual Refinement

Full spec in `redesign-plan-v1.1.md` §AA (Madrid's direct spec, 2026-07-15). Split into two parts because part B is genuinely blocked on earlier features, not just sequenced after them for convenience:

**Part A — buildable now, no dependency on Features 21/22/24:**

- Strip Section cards to plain print styling (no card border/shadow/background)
- Button relabel ("+ Selection"/"+ Prayer"/"+ Cue"/"+ Formula"), resize (-25%), restyle (outline, rounded, transparent), reposition (below the Section name, not beside it)
- Unify Compiler + export typeface to Ibarra Real Nova throughout (currently mixed with Old Standard TT/Inter)
- Page title (~14pt, all caps), church logo (~2in), metadata block (Title Case Small Caps date + Lord's Day #, both centered to each other, pushed to Column 1's far right)
- Section names bold/all-caps; reference/title shares the Section-name line (right-aligned) unless too long, then drops below
- Body ~12pt-equivalent, references ~10pt-equivalent
- Sermon layout: reference on the Section-name line (or below if long), title centered in Column 2 (Title Case Small Caps), preacher name below (~10pt)

**Part B — blocked, needs Features 21/22/24 first:**

- Song item title styling (Title Case italic) — needs the Psalm/Hymn item type (21) to have a `title` field distinct from a Selection's citation
- Offertory Call reference-only / Affirmation of Faith title-only — this *is* Feature 22's scope, not new work
- `#C00000` citation red — reconcile into the single citation token Feature 24 defines, don't ship two red tokens for the same concept

**Logic:**

- No new schema for Part A — pure `SectionCard`/`LiturgyDocument` styling pass
- Part B's schema needs ride along with Features 21/22/24 respectively, not duplicated here

---

## Feature Count

| Phase | Name | Features |
| --- | --- | --- |
| 1 | Bible Reader Foundation | 2 |
| 2 | Liturgy Creation & Compile View | 4 |
| 3 | Item Types | 4 |
| 4 | Export & History | 3 |
| 5 | Hover Preview | 1 |
| **v1 Total** | | **14** |
| 6 | v1.1 — Shell & Compile View Redesign | 5 |
| 7 | v1.1 — Content Model | 9 |
| **v1.1 Total** | | **14** |
