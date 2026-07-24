<!-- System architecture: how the app is structured and how data flows through it -->

# Architecture

## Stack

| Layer | Tool | Purpose |
| --- | --- | --- |
| Framework | Next.js | Full-stack framework — pages, API routes, server actions |
| Database | Supabase (Postgres) | Primary data store — hybrid relational + JSON |
| Auth | None in v1 | Single user; Supabase Auth available for v3 access control |
| Word export | `docx` | Leader Guide / Congregation Bulletin export — **active mechanism as of v2**, both templates, continuous-flow multi-column layout with manual column-break overrides |
| PDF (legacy, frozen) | @react-pdf/renderer | Original Leader Guide / Congregation Bulletin export, Morning only — still present and working (`app/api/liturgy/[id]/export?format=pdf`) but no longer linked from the UI |
| Styling | Tailwind CSS v4 | UI, via `@theme` tokens (see ui-tokens.md) |
| Language | TypeScript strict | Throughout |
| Bible text | Self-hosted AB1905 + BSB datasets; BibleGateway RefTag/BGLinks widget for AB1905→AB2001 hover cross-check; self-hosted expanded-context hover for BSB citations (`/api/bible/context`) | Reader + licensed hover preview + self-hosted context preview |

---

## Folder Structure

```
/
├── context/                    # CTP context files (this set)
├── app/
│   ├── page.tsx                 # Homepage (v1.1) — hero, CTAs, recent-liturgies preview; was the dashboard pre-v1.1
│   ├── liturgies/                # Liturgy Compiler page (v1.1) — full history list + New Liturgy CTA, moved from app/page.tsx
│   ├── reader/                  # Bible reader
│   ├── liturgy/
│   │   ├── new/                 # Template + date picker, Lord's Day auto-calc
│   │   └── [id]/                 # Compile view (continuous-flow, v2) + /export (.docx, both templates; legacy PDF still served, unlinked) + /view (web view, both templates)
│   ├── library/                  # Browse Library — Formulas, Prayers/Guides, Songs, Existing Selections; replaces app/formulas/ + app/prayers/
│   └── api/                     # Route handlers (Lord's Day calc, docx/PDF generation, etc.)
├── components/
│   ├── ui/                      # Design-token-driven primitives
│   └── liturgy/                 # Section, Item, template-specific components, plus icons.tsx
│                                 # (shared icon set — pencil/trash/clear/note/download/copy-link/check, stroke-width 2)
├── lib/
│   ├── bible/                   # Bible-provider abstraction (single interface; AB1905/BSB/AB2001/MBB behind it)
│   ├── liturgy/                 # Lord's Day calculation, dedup logic, template definitions, Section-context resolution,
│   │                             # item removal (removeItemAction.ts), item ordering (sortSectionItems.ts), citation
│   │                             # en-dash formatting (formatCitation.ts), Trinitarian Seal text (trinitarianSeal.ts),
│   │                             # markable-Section rules (markableSections.ts), Verbal Cue templating
│   │                             # (verbalCueTemplates.ts, resolveVerbalCueTemplate.ts — v2), and prepareSectionRender.ts
│   │                             # — the single shared "how does a Section's items lay out" helper used by docx
│   │                             # export, the legacy PDF, and the Web View (see Invariants)
│   ├── docx/                    # .docx generation (v2) — the active export mechanism (LiturgyDocx.ts, logo.ts,
│   │                             # fonts.ts, columnLayout.ts, tokens.ts)
│   ├── formulas/                # Formula library reads/writes (added Feature 08)
│   ├── prayers/                 # Prayer library reads/writes (added Feature 10; gains `guide` kind in v1.1,
│   │                             # redesigned 2026-07-23 into independent `kind` (audience) + `is_guide` (placeability))
│   ├── songs/                    # Psalm/Hymn ("Songs") library reads/writes (v1.1)
│   ├── selections/                # Scripture Text Library ("Existing Selections") reads/writes (v1.1)
│   ├── text/                    # Typographic normalization, markdown bold parsing, span-tag (marks) handling
│   │                             # (applyMarks/shiftMarksForEdit in marks.ts), bold-toggle (toggleBold.ts),
│   │                             # textarea autosize (autosize.ts)
│   └── pdf/                     # Legacy PDF generation (frozen, v1.1-era) — Morning's 3-column layout only; still
│                                 # functional at ?format=pdf but no longer linked from the UI (see docx/ above)
└── types/                       # Shared TypeScript types (Liturgy, Section, Item, Formula, Prayer, Song, TextMark)
```

---

## System Boundaries

| Folder | Owns |
| --- | --- |
| `app/` | Pages and route handlers only. No business logic. |
| `components/` | UI only. No direct DB calls. |
| `lib/bible/` | The Bible-provider abstraction — the only place that knows which translation source is active. Nothing outside this folder calls a translation source directly. |
| `lib/liturgy/` | Lord's Day computation, Selection dedup rule, template/Section definitions, Section item-type whitelist (v1.1), item removal/ordering, citation formatting, and `prepareSectionRender.ts` (the single source of truth for header-reference/multi-Selection-merge layout, shared by the PDF and Web View). No UI concerns. |
| `lib/songs/` | Psalm/Hymn ("Songs") library reads/writes (v1.1). |
| `lib/selections/` | Scripture Text Library reads/writes (v1.1) — auto-save on every Selection submission, independent of whether the parent liturgy is saved. |
| `lib/pdf/` | PDF generation only, reading compiled Liturgy data — no data mutation. Morning only as of v1.1. |
| `types/` | TypeScript types shared across the project. |

---

## Data Flows

### Flow 1 — Adding a Selection

```
User highlights a passage in the Reader
        ↓
Reader calls lib/bible (active provider: AB1905 or BSB)
        ↓
User assigns passage to a Section
        ↓
lib/liturgy dedup check (exact citation match within that Section)
        ↓
Server action writes Item (type: Selection) to Postgres,
AND lib/selections writes the same Selection into the Scripture
Text Library (v1.1) — independent of whether the liturgy itself
is ever saved
        ↓
Reader UI updates with the "already saved" marker for that citation
```

### Flow 2 — Exporting a Morning Liturgy

```
User requests export from /liturgy/[id]/export
        ↓
API route reads full Liturgy (Template → Sections → Items) from Postgres
        ↓
lib/pdf builds two views: all items (Guide) / items minus leader-only Verbal Cues (Bulletin)
        ↓
@react-pdf/renderer generates both PDFs, 2-page/3-column layout (v1.1)
        ↓
User downloads both files
```

### Flow 3 — Sharing a Vesper Liturgy (v1.1)

```
User requests /liturgy/[id]/view
        ↓
Page reads full Liturgy (Template → Sections → Items) from Postgres —
same read path as the PDF flow, no separate data model
        ↓
Renders a public, mobile-first responsive page (not a download) —
distinct from the lib/pdf/ pipeline entirely
        ↓
User shares the URL directly; no PDF generated for Vesper in v1
```

---

## Database Schema

All tables below are live and shipped. The hybrid relational/jsonb split (decided in the CTP planning stage) has held up through v1 and all of v1.1 without needing revision — see the "Decided" note near the end of this section.

### `templates`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| name | text | "Morning Worship" / "Vesper Worship" |
| sections | jsonb | Ordered array: `{ name, posture: 'standing'\|'seated', dynamic_naming: boolean, page: 1\|2, column: 1\|2\|3, item_types: ItemType[] }` — fixed in v1, editable in v2. `page`/`column` and `item_types` added v1.1 (see below); `page`/`column` apply to both templates even though only Morning currently renders them into a PDF — Vesper's Compile View uses the same layout, its *output* just differs (see `redesign-plan-v1.1.md` §F). |

**v1.1 structural change:** Morning Worship's "Charge & Benediction" Section splits into two separate Sections — "Charge" and "Benediction" — inserted where the combined Section sat, immediately before Doxology. Morning goes from 17 to 18 Sections. **One real liturgy already exists in the database** — this insertion must recheck the live liturgy count first and migrate that liturgy's `sections` rows correctly (re-indexing `template_section_index` for every row after the insertion point), not assume a clean insert. Same precaution as the earlier Call to Confession insertion (see Session Memory Bank in `progress-tracker.md`).

**`item_types` values, corrected to match the actual `Item['type']` union shipped in `types/liturgy.ts`:** `'selection' | 'formula' | 'verbal_cue' | 'prayer' | 'sermon' | 'song'` — the per-Section whitelist of which "Add X" buttons a Section actually offers. (Psalm/Hymn are not separate item types — both are `'song'`, tagged by the `songs` table's own `kind` column; `'sermon'` is real and used on the Sermon Section, both corrections to what this line previously said.) See `redesign-plan-v1.1.md` §Y for the full Section-by-Section mapping across both templates.

### `liturgies`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| template_id | uuid | References `templates` |
| service_date | date | User-selected date |
| lords_day_number | integer | Computed on insert, never edited |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| show_end_note | boolean | v2 — whether the exported docx appends "~ End of {templateName} ~". Defaults `true`, matching prior manual practice. |

### `sections`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| liturgy_id | uuid | References `liturgies` |
| template_section_index | integer | Which Template slot this fills |
| items | jsonb | Ordered array of Item objects (see below) |
| column_break_before | boolean | v2 — "start this Section at the top of the next Word column," a per-liturgy authoring decision. Lives on this instance row, not `templates.sections`, since it's this week's actual content, not a template default. Defaults `false`. |
| show_prayer_guide | boolean | v2 — whether *this* liturgy's docx export includes this Section's Prayer Guide (if one exists). Defaults `true`. |

**Item shape (within `sections.items` jsonb) — as actually shipped, `types/liturgy.ts`:**
```json
{
  "type": "selection" | "formula" | "verbal_cue" | "prayer" | "sermon" | "song",
  "text": "markdown string (selection only — blank for long-reading Sections that store only a citation)",
  "citation": "Ps 95:1-3 (selection only, en-dash-normalized via lib/liturgy/formatCitation.ts)",
  "amenExpected": "boolean, optional (selection only, song-slot Sections)",
  "trinitarianSeal": "'en' | 'fil', optional (selection only, Benediction) — appended as plain text after `text` at display time (never folded into the stored string), with an accompanying `bold` mark over the appended range",
  "marks": "TextMark[], optional (selection and formula only — see Invariants)",
  "translation": "'fil' | 'en', optional (selection only, v2 — BSB support; absent means 'fil')",
  "formulaId": "uuid (formula only, references formulas table)",
  "overrideText": "markdown string or null (formula only, optional per-instance override)",
  "visibility": "'both' | 'leader_only' (formula and verbal_cue only)",
  "prayerId": "uuid (prayer only, references prayers table)",
  "passage": "string (sermon only)",
  "songId": "uuid (song only, references songs table)",
  "rubric": "boolean, optional (verbal_cue only)",
  "textAlternate": "string, optional (verbal_cue only, v2 — a second-language variant of this cue)",
  "showAlternate": "boolean, optional (verbal_cue only, v2 — show textAlternate instead of text)"
}
```

**Fully implemented as of 2026-07-18.** `Item = SelectionItem | FormulaItem | VerbalCueItem | PrayerItem | SermonItem | SongItem`. Two corrections to the original proposal, both confirmed live: `PrayerItem` is `{ id, type: 'prayer', prayerId }` only — no `overrideText`, no `visibility` (Prayer has no override mechanic and always shows in both Guide and Bulletin, unlike Formula/Verbal Cue). And `formulas` gained `section_name` — Formula turned out to need the same per-Section scoping as Prayer, a retrofit applied 2026-07-13. `PsalmItem`/`HymnItem` from the original v1.1 proposal were consolidated into one `SongItem { songId }` referencing the shared `songs` table's `kind` column, rather than two separate item types — simpler, and `kind` was already the established pattern from `prayers`.

### `formulas`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| section_name | text | Which Section this Formula belongs to (e.g. "Assurance of Pardon"). Added 2026-07-13 — originally one global catalog, retrofitted to match Prayer's per-Section scoping. `unique(section_name, name)`. |
| name | text | e.g. "Absolution" |
| default_text | text | Editable master default |
| access_level | text | Reserved for v3 role-based control; unused in v1 |
| marks | jsonb | v2 — library-level Congregation/Minister/Small-Caps marking (see Invariants). Placing this Formula copies these onto the new placed instance as a starting point. Defaults `[]`. |

### `prayers`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| section_name | text | Which Section this prayer belongs to (e.g. "Confession of Sin") — filtered by Section **name**, so the same tag matches that Section in both Morning and Vesper |
| text | text | The prayer itself, or the guide's checklist text if `is_guide = true` |
| kind | text | `'corporate'` \| `'leader'` — redesigned 2026-07-23 (was `'prayer'` \| `'guide'`, v1.1). Now purely audience: `'corporate'` means the whole church prays it (both Bulletin + Guide, same as before); `'leader'` means it's the leader/minister's own material (Guide only — `resolveItemText.ts`'s `leaderOnly` is now derived from this, the same pattern Formula/Verbal Cue's `visibility` already used). Meaningless when `is_guide` is true. |
| is_guide | boolean | Added 2026-07-23 (`20260723020000_prayer_kind_redesign.sql`), replacing the old `kind = 'guide'` value — placeability is now independent of audience. A `true` row is a fixed structural checklist (e.g. Invocation's Adoration → Humble Approach → Acceptance → Thanksgiving → Trinitarian Conclusion) shown as reference next to "Add Prayer," never stored as liturgy content itself. Defaults `false`. |
| marks | jsonb | 2026-07-23 (`20260723010000_prayer_marks.sql`) — library-level marking, same convention as `formulas.marks`/`scripture_selections.marks`. A placed `PrayerItem` has no per-instance override of its own (unlike Formula), so it always reflects this row's current marks directly, same as it already does for `text`. Defaults `[]`. |

### `songs` (v1.1, new)

Shared Psalm/Hymn library — one table, tagged by kind, mirroring the `prayers`/`kind` pattern above.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| section_name | text | Section-scoped like `formulas`/`prayers` |
| kind | text | `'psalm'` \| `'hymn'` |
| title | text | Psalm: the reference itself, e.g. "Psalm 103:1-5". Hymn: the hymn's title. |
| attribution | text | Psalm: versification (e.g. "Reformed Life Community Church"). Hymn: author. Same column, different meaning per `kind` — no lyric/body text stored either way. |
| year_published | integer | Optional |
| notes | text | Optional |

Congregation-facing output shows `title` only (Psalm: title case, italic, `text-citation` red; Hymn: title case, italic, no red). Leader Guide shows all columns.

### `scripture_selections` (v1.1, new — "Existing Selections" / Scripture Text Library)

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| section_name | text | Section-scoped like `formulas`/`prayers`/`songs` |
| citation | text | e.g. "Ps 95:1-3" |
| text | text | The Selection text (may be blank for reference-only entries, matching `SelectionItem.text`'s new optionality) |
| translation | text | v2 — `'fil'` (AB1905) or `'en'` (BSB). A Filipino/English pair for the same passage is linked by canonical verse reference, not a foreign key. |
| marks | jsonb | v2 — library-level marking, same as `formulas.marks` above. Defaults `[]`. |

Written to on **every** Selection submission via the Reader's `+` marker, regardless of whether the parent liturgy is ever saved — auto-save-always was a deliberate choice (see `redesign-plan-v1.1.md` §I), not an oversight. No cleanup/retention logic in v1; orphaned entries from abandoned liturgies are an accepted tradeoff, flagged for a future manual review tool.

### `bible_verses`

| Column | Type | Notes |
| --- | --- | --- |
| id | bigint (identity) | Primary key |
| translation | text | `'AB1905'` \| `'BSB'` |
| book | text | |
| chapter | integer | |
| verse | integer | |
| text | text | |

Unique on `(translation, book, chapter, verse)`. Seeded once from public-domain source files (see library-docs.md); read exclusively through `lib/bible/index.ts`.

### `verse_highlights`

| Column | Type | Notes |
| --- | --- | --- |
| id | bigint (identity) | Primary key |
| book | text | |
| chapter | integer | |
| verse | integer | |
| color | text | `'accent'` \| `'success'` \| `'info'` \| `'warning'` |
| updated_at | timestamptz | |

Unique on `(book, chapter, verse)` — keyed by citation only, not translation, so a highlight persists across a translation switch (decided 2026-07-12). No `user_id` (single-user v1).

This keeps dedup and Formula/Prayer/Song/Selection-reuse queryable directly in SQL (citation and the various `*_id` fields are real columns/keys), while Item content stays flexible in jsonb since its shape varies by type — the hybrid split we already agreed on.

**Decided:** jsonb for v1 and v2 both. Simpler to build, and neither v1 nor v2 needs to query across items — v2's docx export reads a whole liturgy in one shot, exactly like the legacy PDF export did, which jsonb handles fine. Migrating Items to their own child table (one row per item, tagged by Section) is **v3 item 1** — corrected here 2026-07-22, this line previously said "v2," which had drifted out of sync with `build-plan.md`'s actual 2026-07-20 v2/v3 scoping. v3 is where Sections become editable/reorderable and where search/tagging/coherence-score all need real per-item rows, so that's the natural point to revisit the storage shape, not before.

---

## Storage

No file storage — `.docx` files (and the legacy PDF, still served at `?format=pdf`) are generated on demand and downloaded directly, never persisted server-side.

---

## Authentication

None in v1 — single user, no login screen. Supabase Auth is the planned provider whenever v3's role-based access control is built (Formula edits gated, Verbal Cues/Prayers remain open).

---

## Bible-Provider Abstraction Pattern

```typescript
// lib/bible/index.ts — the ONLY place that knows which translation source is active.
// Everything else calls getVerse()/getChapter(), never a translation source directly.

interface BibleProvider {
  getVerse(book: string, chapter: number, verse: number): Promise<string>;
  getChapter(book: string, chapter: number): Promise<string[]>;
}

// AB1905 and BSB are real providers, queried directly for the Reader.
// AB2001/MBB are NOT providers here — they are display-only via the
// BibleGateway hover widget (lib/bible does not fetch or store their text).
```

**Citation hover behavior (`components/liturgy/ScriptureCitationLink.tsx`), split by translation:**
- **AB1905 citations** link to BibleGateway's AB2001 (a genuine cross-translation check against a newer Filipino translation this project doesn't self-host) — unchanged, existing behavior.
- **BSB citations** use a self-hosted expanded-context hover instead — showing this passage's own self-hosted BSB text is redundant with what's already displayed, but showing *more of it* (surrounding verses) has real value, and doesn't require any external service since BSB is already self-hosted. `app/api/bible/context/route.ts` parses the citation, fetches the chapter via `getChapter("BSB", ...)`, and slices out a ~7-verse window via `lib/bible/contextWindow.ts` (short citations get padded outward to the window size, shifting instead of truncating at a chapter boundary; citations already at or above the window size pass through untouched). Clicking through opens `/reader` at that chapter for full context.

---

## Invariants

Rules the AI agent must never violate:

- No component may call a Bible translation source directly — always through `lib/bible`'s abstraction.
- AB2001 or MBB text is never fetched, stored, or persisted anywhere in this codebase — display only, via the licensed BibleGateway widget, until Philippine Bible Society grants adaptation rights.
- Selection dedup (exact citation match within a Section) is enforced at the `lib/liturgy` layer, not left to UI validation alone.
- Editing a Formula's `default_text` must never retroactively change a Liturgy that used an `override_text` for that instance.
- All liturgical text content (Selection, Formula, Prayer, Verbal Cue) is normalized to typographic quotation marks and apostrophes (' ' " ") at write-time, in `lib/text/typographic.ts` — never left as straight marks (' ") in storage. This runs once, on save, so the Compile View, Leader Guide, and Congregation Bulletin all inherit correct typography automatically rather than each needing to re-apply it. **Implemented 2026-07-14** — `normalizeTypography()` is wired into all six write paths (`addSelectionAction`, `addFormulaAction`'s override text, `formulaActions.createFormula`/`updateFormula`, `prayerActions.createPrayer`/`updatePrayer`, `verbalCueActions.addVerbalCue`/`updateVerbalCue`). This invariant was documented since the CTP planning stage but had zero implementation until a `/review` audit caught it.
- A Formula or Prayer placed into a Section must belong to that Section (`section_name` match) — enforced server-side in `addFormulaAction`/`addPrayerAction` via `lib/liturgy/getSectionContext.ts`, not just by the Add panel filtering which entries it shows. Added 2026-07-14 after a `/review` audit found the 2026-07-13 Section-scoping retrofit was only enforced in the UI — a Server Action called directly (bypassing the filtered picker) would have silently written a mismatched pair. **This pattern extends to Songs and Existing Selections (v1.1) — apply the same server-side check when those write actions are built, not just UI filtering.**
- No hardcoded hex values or raw Tailwind color classes in components — use tokens from ui-tokens.md.
- Leader/Congregation/Minister/Small-Caps/Bold span tags are never baked into an item's raw saved `text`/`overrideText`/`default_text` — always stored separately, as the `marks` field on `SelectionItem`, `FormulaItem`, `Formula`, `Prayer`, and `ScriptureSelection`. Un-marking a span is a clean, lossless operation that never mutates the underlying prose. Editing the text after marks exist no longer wipes them (as it did through 2026-07-18's earlier passes) — `lib/text/marks.ts`'s `shiftMarksForEdit()` diffs old vs. new text and resizes/shifts only the marks actually touched by the edit. **Overlap rule (2026-07-23, corrected same day):** only `congregation`/`minister` are mutually exclusive with each other (a span can't be both at once — `leader` is the implicit default, never actually stored). `bold` and `small_caps` are both independent overlays that may freely combine with a Congregation/Minister span, with each other, or stand alone. Small Caps was originally grouped in with the exclusive set too, which was wrong: it's a typographic convention (reverential capitalization of a divine name), orthogonal to *who's speaking*, not a competing claim on the same range — treating it as exclusive meant marking a word inside an existing Congregation span split that span into two separate rendered blocks with the word visually isolated onto its own line between them (Congregation/Minister render as their own block-level element, so an inline word sandwiched between two blocks gets forced onto its own line by the surrounding breaks). Moving Small Caps into the same overlay treatment Bold already has removes this failure mode the same way promoting Bold off `**markdown**` did. `lib/text/marks.ts`'s `applyMarks()` is the single place that resolves all three layers (the exclusive Congregation/Minister split, plus the two independent overlays) together.
- A Section only offers the Item types listed in its `templates.sections[].item_types` whitelist — "Add Selection" etc. must not appear on a Section that doesn't list it. Governs adding only; an already-placed item never disappears if its type later drops off the whitelist.
- A non-Sunday `service_date` never displays a Lord's Day number anywhere in the app (Compile View, PDF, Liturgy History, naming convention) — `getLordsDayNumber()`'s computation itself is unchanged, this is purely a display suppression rule.
- **Citations are always run through `lib/liturgy/formatCitation()` before being displayed** — converts a verse-range hyphen to an en dash (e.g. "47:5-9" → "47:5–9"). Applied centrally in `resolveItemText.ts` (Selection labels, Song titles) and in the header-reference builders (`prepareSectionRender.ts`, `SectionCard.tsx`), not re-applied ad hoc per renderer — this is what let the fix apply retroactively to already-saved citations with no migration.
- **`prepareSectionRender.ts` is the single source of truth for how a Section's items lay out** (header-reference text — Selection citations, a Creed/Church-Covenant Formula's name, or a lone Song's title — plus the multi-Selection merged-paragraph text/marks), shared by the PDF export and the Web View. `SectionCard.tsx` (Compile View) keeps its own parallel logic rather than importing this helper, since it alone needs editing-state awareness (falling back to per-item rendering while a Selection is being edited) that the two read-only surfaces never need — but any change to the header-reference or merge rules must be applied in both places, or the three surfaces will drift.
- Deleting an item (any of the six types) goes through one generic action, `lib/liturgy/removeItemAction.ts`'s `removeItem()` — never a per-type delete function. All six item types live in the same `items` jsonb array, so removal is always the same array-filter operation regardless of type.
- Small Caps marking is available on every Section that can hold a Selection (`lib/liturgy/markableSections.ts`'s `getSelectionMarks()`) — it's a per-word reverential-capitalization convention (divine names), not scoped like the Leader/Congregation/Minister dialogue treatment, which stays genuinely restricted to Sections that alternate speaking parts.
- The public Liturgy Web View (`/liturgy/[id]/view`) never shows the app's own top nav bar — `TopNavLinks.tsx` returns `null` for that route. A page meant to be shared by URL with a congregation member has no business exposing internal compiler navigation.
