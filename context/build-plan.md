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

**Closed out 2026-07-16:** Madrid ran the `scripture_selections` migration; verified live end-to-end (real Formula/Prayer/Selection data all rendering, Songs correctly still deferred to Feature 21). The `/library` page itself, `getScriptureSelections.ts`, and `ScriptureSelectionRow` had already been built in an earlier session but were never verified against a real migrated database or documented in `ui-registry.md` — both done now. The "Prayers + Guides" split in the UI line above is Feature 27's addition, not part of this feature's original build.

### 21 Psalm & Hymn Item Types (Songs Library)

**UI:**

- New "Add Psalm"/"Add Hymn" pickers on the 5 dynamic song Sections, entirely replacing Add Selection there

**Logic:**

- New `songs` table — shared library, tagged by kind (`psalm` | `hymn`), Section-scoped
- Leader Guide shows full metadata (title, versification/author, year, notes); Bulletin shows the styled title only

**DONE (2026-07-16) — migration run, fully closed out.** `Song`/`SongItem` types, `lib/songs/getSongs.ts` + `songActions.ts` (mirrors Formula/Prayer's create/update pattern), `lib/liturgy/addSongAction.ts` (mirrors `addPrayerAction.ts`, cross-checks the Song's `section_name` matches like Prayer's does), `AddSongPanel.tsx` (pick-existing/write-new, same UX as `AddPrayerPanel`). `resolveItemText.ts` gained a `song` case and a `songs` param; `SectionCard`/`LiturgyDocument`/`LiturgyWebView` all thread `songs` through and render a Song item as a styled title only (italic always, plus citation-red for Psalm since it's still Scripture-adjacent — Hymn stays plain). Leader Guide additionally shows attribution/year/notes as a small metadata line; Bulletin and the public web view show title only, per §L. **Real gap, deliberately not attempted:** react-pdf has no italic font face registered (same limitation hit in Feature 26), so the PDF's Song title is upright, distinguished by color/size only — documented in the style comment, not silently wrong. `sectionTitle()` (`lib/liturgy/sectionTitle.ts`) now takes an optional `songs` param and resolves "Psalm/Hymn of X" down to "Psalm of X" or "Hymn of X" once a Song of one kind is placed (Madrid's explicit request) — falls back to the ambiguous form if a Section somehow has both a Psalm and a Hymn placed.

Madrid ran `supabase/migrations/20260716020000_songs.sql`. Closed out with two data-migration scripts (one-off, run and deleted, same pattern as every other migration this session): (1) flipped `item_types` from `selection` to `song` on all 9 dynamic-naming song-slot Sections across both templates, plus Doxology on both (which is a fixed name, not `dynamic_naming`, so the dynamic-naming pass missed it initially — caught and fixed as a second pass); (2) migrated the 10 placeholder-hymn Selections already sitting in the two demo liturgies (added during the earlier "populate a full liturgy" pass) into real `songs` rows + `SongItem`s, tagged with the correct `psalm`/`hymn` kind and a `notes` field flagging them as placeholder entries pending real metadata. Verified live end-to-end across both templates: Compile View, both PDF audiences, and the public web view all return 200; `pdftotext` confirmed Section titles correctly resolve from the ambiguous "Psalm/Hymn of X" down to "Hymn of Adoration"/"Psalm of Thanksgiving"/etc. once a real Song disambiguates them, and Song titles + Leader-Guide-only metadata render correctly.

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

**Rendering treatment, decided 2026-07-16 (Madrid):** Leader is the implicit default — flush left, no label. Minister is flush left but labeled ("Min:"). Congregation is both indented and labeled ("Congr:"). Small Caps applies `font-variant: small-caps` inline, no label.

**Done (2026-07-16), Call to Worship / Prayer of Invocation piece (Leader/Congregation/Small Caps only):** `TextMark { start, end, type }` added to `types/liturgy.ts`, stored on `SelectionItem.marks`. `lib/text/marks.ts`'s `applyMarks()` splits text into segments by mark, shared by `MarkedText.tsx` (Compile View), the PDF's inline rendering, and `LiturgyWebView`. Marking happens in `AddSelectionPanel` at add-time (a new `markable` prop, gated to `"Call to Worship"`/`"Prayer of Invocation"` in `ReaderClient.tsx`) — select a text range in the textarea, click a label button, offsets are recorded via `textarea.selectionStart`/`selectionEnd`. Editing the text after marking clears all marks rather than risk stale offsets (a documented limitation, not silently wrong). `normalizeTypography()` confirmed length-preserving (every substitution is 1-char-for-1-char) so offsets survive the server-side typographic pass unchanged. PDF has no italic/small-caps glyph limitation to work around here since the marking treatment is layout-based (indent + label), not font-style-based — unlike Feature 26's rubric italic, this one degrades identically in both CSS and PDF. Verified live end-to-end: marked a real Congregation span, confirmed the 24px indent + "Congr:" label rendered correctly in the Compile View and in a real PDF export (`pdftotext -layout`), then removed the test item.

**DONE (2026-07-18) — Minister + Church Covenant piece, closing out Feature 25 entirely.** `FormulaItem` gained the same `marks?: TextMark[]` field as `SelectionItem`; `lib/liturgy/addFormulaAction.ts`'s `updateFormulaItem()` is the first-ever edit path for an already-placed Formula (previously placed once via `AddFormulaPanel` and never touched again — the exact prerequisite this section originally flagged as blocking). New `FormulaEditForm.tsx` mirrors `AddSelectionPanel`'s marking UX, parameterized by an `availableMarks` prop. `SectionCard.tsx`'s `FORMULA_MARK_SECTIONS` whitelist: `"Assurance of Pardon"` → `["minister", "congregation"]` (Congregation added in a same-day follow-up once Madrid caught Absolution's own dialogue needing it too), `"Charge"`/`"The Great Commission"`/`"Benediction"` → `["minister"]`, `"Affirmation of Faith / Church Covenant"` → `["congregation", "small_caps"]`. All three renderers (Compile View, PDF, Web View) widened their "is this a marked item?" check from `item.type === "selection"` to `item.type === "selection" || item.type === "formula"`.
- Small Caps was later generalized (2026-07-18, same-day follow-up pass) from "Call to Worship/Prayer of Invocation only" to **every Section that can hold a Selection** — `lib/liturgy/markableSections.ts`'s `getSelectionMarks()` replaced the old static two-Section dict. Reasoning: Small Caps is a per-word reverential-capitalization convention (divine names), meaningful on any Scripture text, unlike the Congregation/Minister dialogue treatment which stays genuinely scoped to Sections that alternate speaking parts.
- `**bold**` markdown remains the live option everywhere this tool doesn't apply — and is now universally available via a dedicated Bold button (`lib/text/toggleBold.ts`) on the Add/Edit Scripture forms, independent of whether a Section has a marking toolbar at all.

### 26 Verbal Cue Defaults & Rubric

**UI:**

- Default pre-filled Verbal Cue at the start of every Section except an explicit per-template exclusion list (`redesign-plan-v1.1.md` §V.1)
- Placeholder auto-substitutes real values (title/citation) already added to that Section, from a per-Section bilingual sample script
- Rubric-styled Verbal Cue variant (Sentence case, italic) for Confession of Sin's (Morning) ending instruction

**Logic:**

- Per-Section sample-script lookup — code-level constant, not a DB table (doesn't vary per liturgy)

**Done (2026-07-16), Rubric-style piece:** `VerbalCueItem` gained a `rubric` field, a checkbox in `VerbalCueForm`, and italic (CSS)/muted-color (PDF, no italic face registered) rendering across all three renderers. Verified live with the actual approved Confession-of-Sin (Morning) closing text. **Still deliberately unbuilt:** the default-pre-filled-Verbal-Cue-per-Section mechanism and its "auto-substitute real values from a per-Section sample script" — that sample-script content doesn't exist and per this project's "real gap, not a placeholder" rule (see Formula/Prayer's empty seed data) shouldn't be fabricated. Building the exclusion-list *mechanism* without real script content to substitute would just force-insert empty/generic cues into real liturgies, which is a worse default than none.

### 27 Prayer Guides & Amen Rule

**UI:**

- `guide`-kind Prayer library entries, shown as a reference panel next to "Add Prayer" on the Sections listed in `redesign-plan-v1.1.md` §W
- Amen Rule indicator (does this song customarily end in a sung Amen) — Leader Guide only, never the Bulletin

**Logic:**

- `prayers` gains a `kind` column (`prayer` | `guide`)
- Amen Rule is a per-Section/per-song-slot code-level lookup, not stored liturgy data

**Done (2026-07-16), Amen Rule piece:** built as real per-item data, not a code-level lookup — re-reading §X, "per-song-slot" is ambiguous between "per Section" and "per specific song," and different hymns in the same slot genuinely differ on whether they end in a sung Amen, so a static constant would have been guessed data this agent has no basis for. `SelectionItem` gained `amenExpected?: boolean`, settable via a checkbox in `AddSelectionPanel` shown only when `TargetSection.dynamicNaming` is true (a new field `getTargetSection.ts` returns), rendered as a small badge in `LiturgyDocument`'s Leader Guide only — confirmed absent from the Bulletin PDF via a real end-to-end save/export/cleanup pass.

**Done (2026-07-16), Prayer Guides piece — Feature 27 is now fully complete.** Madrid ran `20260716010000_prayer_guides.sql`; `Prayer` gained a required `kind: "prayer" | "guide"` field, `PrayerForm` gained a Kind select (threaded through `createPrayer`/`updatePrayer`, `NewPrayerClient`, `PrayerListRow`), `SectionCard` now filters its `prayers` prop into `sectionPrayers` (kind `"prayer"`, feeds `AddPrayerPanel`'s picker) and `sectionGuides` (kind `"guide"`, feeds the new `PrayerGuidePanel`) — a guide can never be placed into a liturgy as an actual item. `PrayerGuidePanel` renders on the six Sections §W lists (`"Prayer of Invocation"`, `"Prayer for Illumination"`, `"Prayer for Pardon"`, `"Prayer before Communion"`, `"Closing of the Table"`, `"Pastoral Prayer"`), returning nothing when no guide exists yet. `/library`'s Prayers list split into separate "Prayers" and "Guides" sections. Verified live end-to-end: created a real test guide via `/prayers/new`'s Kind selector, confirmed it appeared in the reference panel and was absent from the Add-Prayer picker, then removed it.

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

## Phase 8 — Direct-Observation Refinements (post-v1.1, 2026-07-18)

Not part of the original v1.1 scope — Madrid drove the app directly across several sessions on 2026-07-18 and this phase is the accumulated result. Unlike Phases 1-7, this wasn't pre-scoped in `redesign-plan-v1.1.md`; each item below is a real bug or gap caught by actual use, fixed the same day it was reported. Grouped here after the fact for a coherent record, not built in this order originally — see `progress-tracker.md`'s Session Memory Bank for the full blow-by-blow.

**New feature, not a fix:**
- **Trinitarian Seal** — a Benediction-only toggle (None/Filipino/English) that appends the exact wording Madrid supplied (`lib/liturgy/trinitarianSeal.ts`) immediately after a Selection's own text, rendered bold via the existing `**bold**` convention. Live preview identical to the Congregation/Minister tool's.
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
- Section-to-Section spacing reduced (was ~32px, now ~16px) to match Madrid's MS Word convention (12pt paragraph + 6pt space-before).

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

**All of v1 and v1.1 (Phases 1-7, 28 features) plus Phase 8's refinement pass are complete as of 2026-07-18.** The only genuinely open item anywhere in the shipped scope is Feature 26's default-Verbal-Cue-seeding, blocked on Madrid supplying real per-Section sample-script content (not a code gap). See `progress-tracker.md` for current status and `project-overview.md`'s Roadmap section for the narrative version of what follows.

---

# v2 (Draft) — Editing Maturity & Library Completeness

**Drafted 2026-07-18, not yet approved feature-by-feature the way v1.1 was** (v1.1 had `redesign-plan-v1.1.md`'s many rounds of direct decisions before this file turned it into build-ready phases — v2 hasn't had that pass). Listed roughly in dependency order, not final phase numbers.

- **Template/Section editing.** Reorder, rename, create Sections within a Template — Templates stop being two hardcoded rows. Almost certainly gates the item-table migration below, since a freely-reorderable Section list is a much better argument for "each item is its own row, not a position in a jsonb array" than the current fixed structure is.
- **Item storage migration** — `sections.items` jsonb array → a proper child table, one row per item. Already decided in `architecture.md`, deliberately deferred to land here rather than v1 or v3.
- **Library completeness**, each independently buildable once decided: Formula delete (no delete path exists for Formula today, unlike every item type as of Phase 8); Scripture Library (`scripture_selections`) edit-in-place (today browse-only); Scripture Library direct-add from `/library` (today only reachable via the Reader's add-to-Section flow); the Congregation/Minister/Small-Caps marking toolbar available when editing a library entry, not just a placed item.
- **Songs Library management page** — real create/edit/delete for Psalm/Hymn entries from `/library`, replacing today's placeholder row and the "can only create one while placing it into a Section" limitation.
- **Vesper's Compile View 3-column layout** — needs the open architecture question below resolved first (fixed page/column assignment like Morning's, vs. continuous flow with per-Section overrides), since building Vesper's version of a design that might get replaced for both templates shortly after would be wasted work.
- **Continuous-flow-with-overrides investigation** (the open question from Phase 8's session): prototype what a continuous-flow Compile View with a manual "push this Section to the next column" control would look like, compare directly against the current fixed-assignment model, and let Madrid choose before committing either template to a specific mechanism.
- **Not phase-gated, do whenever the input arrives:** default Verbal Cue seeding once Madrid supplies real per-Section bilingual sample-script content; an audit-and-cleanup pass on Formula text with legacy manually-typed speaker-label prefixes (Absolution is the confirmed instance).

# v3 (Draft) — Multi-User & Discovery

**Also drafted 2026-07-18, not yet approved.** Depends on v2's item-table migration for items 2-3 below; everything else is independent.

- **Supabase Auth + role-based Formula access control** — `formulas.access_level` has sat unused since Feature 08, reserved for exactly this. Needs a real decision on which roles exist (presider/deacon/preacher per `project-overview.md`'s Target User) and what each can/can't edit.
- **Universal search** across all liturgies/Formulas/Prayers/Songs — needs the item-table migration; not buildable against jsonb arrays at reasonable query cost.
- **Cross-day duplicate flagging + coherence score** — same item-table dependency as search; likely builds on the same underlying query layer.
- **Vesper's PDF export** — no physical Vesper bulletin has ever existed (unlike Morning, which had a real reference document to build against), so this needs its own "what should this look like" design pass, not a mechanical port of Morning's `LiturgyDocument.tsx`.
- **Automated rotation-cycle assignment** for Vesper's recurring readings, replacing the current manual handbook-referenced lookup.
- **Reformed Life PowerPoint Builder integration** — external system; needs a scoping conversation with whoever owns that tool before this can even become a real feature entry.
- **MBB hover-preview toggle** — BGLinks (the widget Feature 14 uses) only supports one active translation globally; a live toggle needs either a DOM-teardown-and-relink approach or accepting a page reload on switch. Real design work, not a data change.
- **AB2001/MBB text extraction into this app's own database** — gated on Philippine Bible Society's response to the adaptation-rights request (drafted in the CTP planning stage, still unsent/unanswered as of this writing). Not schedulable against this project's own timeline.
