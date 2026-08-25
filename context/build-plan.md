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

### 20 Browse Library & Scripture Text Library — DONE (2026-07-16)

**UI:**

- New merged `/library` page (Formulas, Prayers + Guides, Songs, Existing Selections), replacing the separate `/formulas` and `/prayers` pages

**Logic:**

- New `scripture_selections` table — every Selection submission auto-joins it, Section-scoped, regardless of whether the parent liturgy is ever saved
- No retention/cleanup logic in v1 (flagged for a future manual tool)

**Closed out 2026-07-16:** The `scripture_selections` migration was applied and verified end to end with real Formula, Prayer, and Selection data; Songs remained deferred to Feature 21. The `/library` page, `getScriptureSelections.ts`, and `ScriptureSelectionRow` were verified against the migrated database and recorded in `ui-registry.md`. The "Prayers + Guides" split in the UI line above belongs to Feature 27.

### 21 Psalm & Hymn Item Types (Songs Library)

**UI:**

- New "Add Psalm"/"Add Hymn" pickers on the 5 dynamic song Sections, entirely replacing Add Selection there

**Logic:**

- New `songs` table — shared library, tagged by kind (`psalm` | `hymn`), Section-scoped
- Leader Guide shows full metadata (title, versification/author, year, notes); Bulletin shows the styled title only

**DONE (2026-07-16) — migration run, fully closed out.** `Song`/`SongItem` types, `lib/songs/getSongs.ts` + `songActions.ts` (mirrors Formula/Prayer's create/update pattern), `lib/liturgy/addSongAction.ts` (mirrors `addPrayerAction.ts`, cross-checks the Song's `section_name` matches like Prayer's does), `AddSongPanel.tsx` (pick-existing/write-new, same UX as `AddPrayerPanel`). `resolveItemText.ts` gained a `song` case and a `songs` param; `SectionCard`/`LiturgyDocument`/`LiturgyWebView` all thread `songs` through and render a Song item as a styled title only (italic always, plus citation-red for Psalm since it's still Scripture-adjacent — Hymn stays plain). Leader Guide additionally shows attribution/year/notes as a small metadata line; Bulletin and the public web view show title only, per §L. **Real gap, deliberately not attempted:** react-pdf has no italic font face registered (same limitation hit in Feature 26), so the PDF's Song title is upright, distinguished by color/size only — documented in the style comment, not silently wrong. `sectionTitle()` (`lib/liturgy/sectionTitle.ts`) takes an optional `songs` param and resolves "Psalm/Hymn of X" to "Psalm of X" or "Hymn of X" once a Song of one kind is placed, falling back to the ambiguous form if a Section contains both kinds.

Migration `supabase/migrations/20260716020000_songs.sql` was applied. Two one-off data-migration scripts then: (1) changed `item_types` from `selection` to `song` on all nine dynamic song slots and both Doxology Sections; and (2) converted the ten placeholder-hymn Selections in the demo liturgies into typed `songs` rows and `SongItem`s with placeholder notes pending real metadata. Verification covered both templates, both PDF audiences, the Compile View, and the public Web View; Section titles resolve from "Psalm/Hymn of X" to the placed Song kind, and Leader-Guide-only metadata renders correctly.

### 22 Reference-Only Selections & Section Content Corrections

**Logic:**

- `SelectionItem.text` becomes genuinely optional for long-reading Sections (The Lord's Discourses, Words of Institution, Closing of the Table) — citation only, no body text
- Section-specific corrections per `redesign-plan-v1.1.md` §N–T: Confession of Sin (Morning) → Prayer; Doxology (both) → Hymn; Assurance of Pardon/Charge/Benediction/Great Commission → Selection + Formula with the Minister role tool
- The Lord's Table (Vesper) → heading + administrator-name field only, no item picker
- Prayer Meeting (Vesper) → heading only, nothing under it

**Done (2026-07-16), reference-only Selections piece:** the "citation only, no body text" behavior is live for the three long-reading Vesper Sections listed above (`REFERENCE_ONLY_SECTIONS` in `addSelectionAction.ts`, mirrored in `ReaderClient.tsx`). Text stays `string` (not `string | null`) — an empty string is the "no body text" sentinel, `resolveItemText`'s existing contract is unchanged, and all three renderers (`SectionCard`, `LiturgyDocument`, `LiturgyWebView`) skip rendering the body-text block when `resolved.text` is falsy. **Still open, needs its own decisions before building:** Confession of Sin → Prayer (already true today, not a gap), Doxology → Hymn (blocked on Feature 21's Songs library), Assurance of Pardon/Charge/Benediction/Great Commission's Minister role tool (is Feature 25's actual scope), and The Lord's Table's administrator-name field (needs a real data-model decision — a new field on `CompiledSection` vs. a new item type — not made yet).

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

**DONE (2026-07-16/18) — both pieces complete.** Citation-color piece: `--color-citation` corrected to the confirmed real hex `#C00000` (was a provisional `#C0392B` guess); small-caps + citation-color applied to Selection citations across `SectionCard`, `LiturgyDocument` (PDF, color-only — no react-pdf small-caps support), and `LiturgyWebView`, scoped to `item.type === "selection"` only. Closed Feature 28 Part B's citation-red-token line item. Psalm-title piece: landed automatically as part of Feature 21's Song rendering (`SongTitle` in `SectionCard`, the `songTitlePsalm` style in `LiturgyDocument`, and the equivalent conditional in `LiturgyWebView` all apply `text-citation` when `song.kind === "psalm"`, plain text for `"hymn"`) — confirmed already built and correct when checked 2026-07-18, no new code needed.

### 25 Leader / Congregation / Minister / Small Caps Tool

**UI:**

- Span-tagging tool on Call to Worship, Prayer of Invocation (both templates), and the Church Covenant portion of Affirmation of Faith/Church Covenant (Vesper) — Leader/Congregation/Minister speaker labels plus manual Small Caps marking for the Divine Name
- Minister role further restricted to Assurance of Pardon, Charge, Great Commission, Benediction

**Logic:**

- New `marks` field (structured span tags) on Selection/Formula items — never baked into raw saved text; un-marking must be lossless

**Rendering treatment:** Leader is the implicit default — flush left, no label. Minister is flush left but labeled ("Min:"). Congregation is both indented and labeled ("Congr:"). Small Caps applies `font-variant: small-caps` inline, no label.

**Done (2026-07-16), Call to Worship / Prayer of Invocation piece (Leader/Congregation/Small Caps only):** `TextMark { start, end, type }` added to `types/liturgy.ts`, stored on `SelectionItem.marks`. `lib/text/marks.ts`'s `applyMarks()` splits text into segments by mark, shared by `MarkedText.tsx` (Compile View), the PDF's inline rendering, and `LiturgyWebView`. Marking happens in `AddSelectionPanel` at add-time (a new `markable` prop, gated to `"Call to Worship"`/`"Prayer of Invocation"` in `ReaderClient.tsx`) — select a text range in the textarea, click a label button, offsets are recorded via `textarea.selectionStart`/`selectionEnd`. Editing the text after marking clears all marks rather than risk stale offsets (a documented limitation, not silently wrong). `normalizeTypography()` confirmed length-preserving (every substitution is 1-char-for-1-char) so offsets survive the server-side typographic pass unchanged. PDF has no italic/small-caps glyph limitation to work around here since the marking treatment is layout-based (indent + label), not font-style-based — unlike Feature 26's rubric italic, this one degrades identically in both CSS and PDF. Verified live end-to-end: marked a real Congregation span, confirmed the 24px indent + "Congr:" label rendered correctly in the Compile View and in a real PDF export (`pdftotext -layout`), then removed the test item.

**DONE (2026-07-18) — Minister + Church Covenant piece, closing out Feature 25 entirely.** `FormulaItem` gained the same `marks?: TextMark[]` field as `SelectionItem`; `lib/liturgy/addFormulaAction.ts`'s `updateFormulaItem()` is the first-ever edit path for an already-placed Formula (previously placed once via `AddFormulaPanel` and never touched again — the exact prerequisite this section originally flagged as blocking). New `FormulaEditForm.tsx` mirrors `AddSelectionPanel`'s marking UX, parameterized by an `availableMarks` prop. `SectionCard.tsx`'s `FORMULA_MARK_SECTIONS` whitelist: `"Assurance of Pardon"` → `["minister", "congregation"]` to cover Absolution's dialogue, `"Charge"`/`"The Great Commission"`/`"Benediction"` → `["minister"]`, `"Affirmation of Faith / Church Covenant"` → `["congregation", "small_caps"]`. All three renderers (Compile View, PDF, Web View) widened their "is this a marked item?" check from `item.type === "selection"` to `item.type === "selection" || item.type === "formula"`.
- Small Caps was later generalized (2026-07-18, same-day follow-up pass) from "Call to Worship/Prayer of Invocation only" to **every Section that can hold a Selection** — `lib/liturgy/markableSections.ts`'s `getSelectionMarks()` replaced the old static two-Section dict. Reasoning: Small Caps is a per-word reverential-capitalization convention (divine names), meaningful on any Scripture text, unlike the Congregation/Minister dialogue treatment which stays genuinely scoped to Sections that alternate speaking parts.
- `**bold**` markdown remains the live option everywhere this tool doesn't apply — and is now universally available via a dedicated Bold button (`lib/text/toggleBold.ts`) on the Add/Edit Scripture forms, independent of whether a Section has a marking toolbar at all.

### 26 Verbal Cue Defaults & Rubric

**UI:**

- Default pre-filled Verbal Cue at the start of every Section except an explicit per-template exclusion list (`redesign-plan-v1.1.md` §V.1)
- Placeholder auto-substitutes real values (title/citation) already added to that Section, from a per-Section bilingual sample script
- Rubric-styled Verbal Cue variant (Sentence case, italic) for Confession of Sin's (Morning) ending instruction

**Logic:**

- Per-Section sample-script lookup — code-level constant, not a DB table (doesn't vary per liturgy)

**Done (2026-07-16), Rubric-style piece:** `VerbalCueItem` gained a `rubric` field, a checkbox in `VerbalCueForm`, and italic (CSS)/muted-color (PDF, no italic face registered) rendering across all three renderers. Verified live with the actual approved Confession-of-Sin (Morning) closing text.

**Done (2026-07-22) — default-pre-filled-Verbal-Cue-per-Section piece, closing out Feature 26 entirely.** Approved cue-script content covers all 16 applicable Morning Worship Sections. `lib/liturgy/verbalCueTemplates.ts` holds the wording verbatim; `lib/liturgy/resolveVerbalCueTemplate.ts` resolves `{{scripture}}`/`{{song}}`/`{{creed}}` tokens against the Selection, Song, or Formula currently placed in that Section. `resolveItemText.ts`/`resolveBase()` accept sibling Items for this live resolution, and `createLiturgyAction.ts` auto-seeds the cues as best-effort `leader_only` content. Binding remains live rather than creation-time-only, while Psalm of Proclamation's second reference remains a literal `[Scripture]` placeholder rather than an automatic binding. Verification confirmed that placing a Selection updates its cue immediately.

### 27 Prayer Guides & Amen Rule

**UI:**

- `guide`-kind Prayer library entries, shown as a reference panel next to "Add Prayer" on the Sections listed in `redesign-plan-v1.1.md` §W
- Amen Rule indicator (does this song customarily end in a sung Amen) — Leader Guide only, never the Bulletin

**Logic:**

- `prayers` gains a `kind` column (`prayer` | `guide`)
- Amen Rule is a per-Section/per-song-slot code-level lookup, not stored liturgy data

**Done (2026-07-16), Amen Rule piece:** built as real per-item data, not a code-level lookup — re-reading §X, "per-song-slot" is ambiguous between "per Section" and "per specific song," and different hymns in the same slot genuinely differ on whether they end in a sung Amen, so a static constant would have been guessed data this agent has no basis for. `SelectionItem` gained `amenExpected?: boolean`, settable via a checkbox in `AddSelectionPanel` shown only when `TargetSection.dynamicNaming` is true (a new field `getTargetSection.ts` returns), rendered as a small badge in `LiturgyDocument`'s Leader Guide only — confirmed absent from the Bulletin PDF via a real end-to-end save/export/cleanup pass.

**Done (2026-07-16), Prayer Guides piece — Feature 27 is now fully complete.** Migration `20260716010000_prayer_guides.sql` was applied; `Prayer` gained a required `kind: "prayer" | "guide"` field, and `PrayerForm` gained a Kind select threaded through create and update flows. `SectionCard` separates placeable prayers from reference guides, so a guide cannot become a liturgy Item. `PrayerGuidePanel` renders on the six Sections listed in §W and returns nothing when no guide exists. The Library separates Prayers and Guides. End-to-end verification confirmed that a guide appears in the reference panel and not in the Add Prayer picker.

**2026-07-23 redesign of this same `kind` field:** The former field conflated audience with checklist placeability. It was split into `kind: "corporate" | "leader"` for audience and `is_guide: boolean` for placeability. `PrayerForm` now presents Corporate/Leader as the Kind choices and a separate, de-emphasized Guide checkbox. Migration `20260723020000_prayer_kind_redesign.sql` was applied in Production on 2026-07-24. It added and backfilled `is_guide`, reclassified Confession of Sin as `corporate` and other rows as `leader`, matched rows by `section_name`/`is_guide` rather than hardcoded IDs, and replaced the constraint and default. Live verification confirmed that a placed `leader` Prayer appears in the Guide DOCX but not the Bulletin.

### 28 Morning Compile View Visual Refinement

Full specification: `redesign-plan-v1.1.md` §AA. It is split into two parts because Part B depends on earlier features.

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

## Phase 8 — Direct-Observation Refinements (post-v1.1, 2026-07-18)

Phase 8 records bugs and gaps found through direct use after v1.1. Unlike Phases 1–7, it was not pre-scoped in `redesign-plan-v1.1.md`; the completed work is grouped here for a coherent record rather than in execution order.

**New feature, not a fix:**
- **Trinitarian Seal** — a Benediction-only toggle (None/Filipino/English) that appends the approved wording from `lib/liturgy/trinitarianSeal.ts` immediately after a Selection's own text, rendered bold via the existing `**bold**` convention. Live preview identical to the Congregation/Minister tool's.
- **Universal item deletion** — every item type (including Song, which has no edit form) gained a trash-icon delete button, via one generic `lib/liturgy/removeItemAction.ts` shared across all six item types. Closed a real standing gap (Benediction ending up with two Trinitarian-formula placements and no way to remove the stray one).

**Correctness fixes:**
- Cue ordering — a Verbal Cue now always renders first in a Section regardless of add order (`lib/liturgy/sortSectionItems.ts`); Scripture now always precedes a Formula in the same Section (the Assurance-of-Pardon "proof text, then declaration" pattern).
- Header-reference mechanic generalized three times over: from "sole Selection item only" to (1) any number of Selections in a Section (citations joined with "; "), (2) a Creed/Church-Covenant Formula's own name when there's no Selection, (3) a single Song's title (italic, citation-red only for a Psalm) — all three now shown inline with the Section title, matching the reference bulletin's layout, in the Compile View, PDF, *and* Web View via one shared helper, `lib/liturgy/prepareSectionRender.ts`.
- Multi-Selection paragraph merge — when a Section draws from more than one passage, the texts now concatenate into one naturally-flowing paragraph (marks offset-shifted correctly) instead of rendering as separate blocks.
- Mark-editing no longer wipes existing marks on every keystroke (`lib/text/marks.ts`'s `shiftMarksForEdit()` resizes only the marks actually touched by an edit).
- En dash for verse ranges, applied both at write time and retroactively at *display* time (`lib/liturgy/formatCitation()`, called centrally from `resolveItemText.ts`) — covers Selections, Metrical Psalter titles, and pre-existing citations with no migration needed.
- PDF-specific: Small Caps no longer forces a line break around itself (was wrapping every marked/unmarked segment in its own block `<View>`); the header-reference citation gets its uppercase small-caps substitute; Song titles render genuinely italic (a real italic Ibarra Real Nova `.woff` was sourced and confirmed embedded); Prayer Guides now actually reach the exported Leader Guide PDF (existed in the Compile View since Feature 27, never wired into the PDF); pagination moved from a top-left header label to a fixed bottom-right footer; margins tightened to 0.3in top/bottom, 0.25in left/right; page size changed to 13in×8in landscape for the 3-column layout.
- A real conflation bug: a Metrical Psalter's title, once it joined the header-reference line, incorrectly went small-caps — `HeaderInfo.styled: boolean` was doing two unrelated jobs (citation-red color, small-caps) at once; split into independent `citationColor`/`smallCaps` flags.
- "No items yet" removed everywhere (Compile View, PDF, Web View) — an empty Section now just shows its heading.
- Body text justified everywhere (Compile View, PDF, Web View).
- Two stale-redirect 404 bugs fixed (`/formulas/new`, `/prayers/new` redirected to routes deleted back in Feature 20).
- A hydration-mismatch console error fixed (`suppressHydrationWarning` on `<html>` — caused by a browser extension injecting attributes, not an app bug).

**UI polish:**
- New shared icon set (`components/liturgy/icons.tsx`, stroke-width 2) — pencil for Edit, trash for Delete, eraser for Clear, download icons on Guide/Bulletin, a new `CopyLinkButton.tsx` (clipboard + "Copy Link" tooltip) replacing the old "View / Share Liturgy" text link.
- `+ Scripture`/`+ Cue`/etc. buttons invert color (box fill + text swap) on hover instead of a neutral gray hover.
- Web View overhaul: typography brought up to date with the Compile View's actual current classes (it had drifted since Feature 28's redesign), and the compiler's own top nav bar is now hidden on `/liturgy/[id]/view` (`TopNavLinks.tsx` returns `null` for that route) — a public congregation-facing share link has no business showing internal nav.
- Section-to-Section spacing reduced from approximately 32px to 16px to match the reference Word document's 12pt paragraph plus 6pt space-before convention.

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
| 8 | Post-v1.1 Direct-Observation Refinements | ~30 individual fixes, not separately numbered |

**All of v1 and v1.1 (Phases 1-7, 28 features), Phase 8's refinement pass, and the approved v2 scope are shipped.** Default Verbal Cue seeding is complete; the remaining Absolution prefix cleanup is a non-gating content backlog item. See `progress-tracker.md` for active work and `project-overview.md` for the current roadmap.

---

# v2 — Translation Breadth, Output, & Library Completeness

This approved phase is substantially built in the current repository. The active DOCX pipeline and continuous-flow authoring replaced new development on the frozen PDF path without splitting product history across repositories. Vesper recurring-reading automation remains open for the canonical scheduling and Great Commission placement corrections in item 4.

1. **Docx export — ✅ done, shipped and verified live 2026-07-22 (this repo *is* the cloned repo this item was scoped for).** Replaces `@react-pdf/renderer` as the export mechanism going forward — `app/api/liturgy/[id]/export/route.ts` now serves both `?format=docx` (default, wired to the Compile View's Guide/Bulletin buttons) and `?format=pdf` (still present, no longer linked from the UI). `lib/docx/LiturgyDocx.ts` builds the actual document (masthead with the real church logo, End-of-Service toggle, Prayer Guide inclusion toggle). Three real bugs found only by opening actual generated `.docx` files and fixed: `docx`'s `createPageSize` swapping width/height under `orientation: LANDSCAPE` (fixed by pre-swapping the dimensions passed in), `ShadingType.SOLID` painting an undefined black foreground instead of `ShadingType.CLEAR`'s background fill, and literal `\n` inside a single `<w:t>` not reliably breaking in Word (fixed by splitting into separate `<w:p>` paragraphs). **`lib/pdf/` stays frozen, not deleted** — the PDF route still works, just isn't exposed in the UI anymore.
2. **Continuous-flow authoring + manual column-break overrides — ✅ done, shipped alongside #1.** Resolved the DOCX layout question in favor of Word's native continuous flow (fills one column, then spills automatically); a "push to next column" override maps directly onto `sections.column_break_before`, with no custom pagination engine. Vesper's DOCX uses the same model, while its Compile View remains flat and has no page/column assignment.
3. **BSB version — ✅ done, shipped and verified live 2026-07-21.** English as a real second Selection source, alongside AB1905/Filipino. Included real Reader work (a translation switcher, Feature 02 shipped without one), translation-aware citation building/parsing, silent auto-pairing (`lib/selections/companionTranslation.ts`) wired into both the Reader and Library direct-add flows, a backfill for every pre-existing library entry, and the Compile View picker's Filipino/English toggle + alternate-translation hover-preview. The open dedup question resolved itself by construction — a Filipino/English pair's citation strings differ by book-name spelling, so they were never at risk of colliding. One real pre-existing data-quality bug found and fixed along the way: several legacy library rows had English-spelled citations over genuinely Filipino text (predating the Tagalog-naming convention) — caught by checking actual stored text before trusting a citation-spelling heuristic, corrected, not left silently wrong. See `progress-tracker.md`'s 2026-07-21 entry for full detail.
4. **Automated rotation-cycle assignment — partially shipped; corrections remain open.** The canonical `Vesper Service and Lord's Table.docx` is the content authority: it defines 12 Lord's Discourses with group-specific Closing texts, a four-Sunday Words of Institution cycle, and a separate four-Sunday Great Commission Text cycle. BA-007 corrected the transcribed Discourse data against that document. `lib/liturgy/vesperTableRotation.ts` currently computes all four results; `createLiturgyAction.ts` auto-places the Discourse, Words of Institution, and Closing selections, and `VesperReadingPanel.tsx` provides manual overrides for those three Sections. The remaining work is to resolve and implement Great Commission placement, plus explicitly decide the calendar-quarter anchor and fifth-Sunday behavior because the canonical document does not state either rule.
5. **Library-level marking toolbar — ✅ done.** Formula and Scripture Library marks are stored at library level and copied onto each new placement as an editable starting point.
6. **Default Verbal Cue seeding — ✅ done.** The legacy Absolution `Minister:`/`Congregation:` prefix cleanup remains a low-severity, non-gating content task.

Items 1–3 and 5–6 are closed. Item 4 remains open only for the Vesper rotation corrections described above. The legacy Absolution `Minister:`/`Congregation:` prefix cleanup remains a separate non-gating content task.

**Shelved cold, not scheduled:**
- **MBB hover-preview toggle** — shelved alongside PDF export.
- Further PDF development — the compatibility route remains frozen.

# v3 — Structure, Multi-User, & Discovery

**Also scoped 2026-07-20.** Sequenced roughly in dependency order — item 1 gates items 2-3's most natural pairing and items 3-5 directly.

1. **Item storage migration — ✅ shipped and cut over.** `section_items` is the live one-row-per-Item model and the former `sections.items` column has been removed.
2. **Template/Section editing.** Reorder, rename, create Sections within a Template — Templates stop being two hardcoded rows. Moved from the original v2 draft; still needs its own `/architect`-style scoping pass before any code, regardless of phase, because every `sections` row references its Template slot by *position* (`template_section_index`) — every past structural Template change (Charge/Benediction split, Offertory/Thanksgiving split) needed a hand-written one-off backup-then-reindex script, and making this end-user-editable means that has to become a real, generic, safe operation instead. Real open questions for that scoping pass: what happens to an in-progress liturgy when its Template changes under it, and does editing a Template retroactively reshape liturgies already using it or only future ones.
3. **Items tagging** — the row-based storage prerequisite is complete. Feeds directly into item 4.
4. **Universal search + cross-day duplicate flagging** — depends on items 1 and 3; not buildable against jsonb arrays at reasonable query cost.
5. **Coherence score** — depends on items 3-4's query layer.
6. **Supabase Auth + Curator/Compiler access control — ✅ done.** Trusted mutations are authorized server-side; anonymous public reading remains available.
7. **Reformed Life PowerPoint Builder integration** — external system; needs a scoping conversation with whoever owns that tool before this can even become a real feature entry. Confirmed for after v2, not dropped.
8. **AB2001/MBB text extraction into this app's own database** — still formally gated on Philippine Bible Society's response to the adaptation-rights request (drafted at CTP planning, still unsent/unanswered). A separate downloader tool is known to exist for *personal-use* extraction — worth being precise that personal-use extraction and this app storing/serving that text to a congregation through a shared product are different situations, and the existence of the former doesn't by itself resolve the licensing question the latter actually depends on.

**Buried cold, not carried as roadmap work:** PDF export. The explicit compatibility route remains in place but is unlinked and does not define current output requirements.
