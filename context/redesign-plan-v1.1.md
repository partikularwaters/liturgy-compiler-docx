<!-- Consolidated, fully-approved redesign plan from the 2026-07-15/16 architecture review session. Not yet applied to the other context/*.md files or code — this is the source-of-truth staging document for that implementation pass. Read this alongside architecture.md/ui-rules.md/ui-tokens.md/project-overview.md/build-plan.md, which it will supersede in the sections it covers once implementation lands. -->

# Liturgy Compiler — Consolidated Redesign Plan (v1.1)

Everything decided across the 2026-07-15/16 review, organized by what actually changes. Nothing has been written to the other `context/*.md` files or code yet — this is the full approved package staged for that implementation pass. **All items are resolved — no open questions remain.**

---

## A. Navigation & global shell

- Sidebar removed. Replaced with a top bar.
- Items: **Liturgies** · **Bible Reader** · one contextual CTA slot (**Create Liturgy** on the homepage → **Browse Library** while inside the Liturgy Compiler page).
- No Sign In/Account item in v1.
- Bar background: existing burgundy accent (`--color-accent`). CTA: new yellow token, chosen for contrast — both explicitly provisional, revisited later in v1.
- Formulas/Prayers/Songs no longer have their own top-level nav entry — reachable via the new **Browse Library** page and via contextual buttons inside Sections where each applies.

**Files:** `components/layout/Sidebar.tsx` + `SidebarLinks.tsx` → replaced by a top-nav equivalent. `ui-rules.md`'s "no top navbar" line reversed. `project-overview.md`'s Navigation section rewritten. New yellow token added to `ui-tokens.md`'s `@theme` block.

---

## B. Homepage (new content at `/`)

- Hero line: *"Glory be to the Father, and to the Son, and to the Holy Spirit; as it was in the beginning, is now, and ever shall be, world without end. Amen."*
- Two CTAs below it: **Create Liturgy** (primary) → Liturgy Compiler page; **Browse Library** (secondary) → merged library page.
- Below that: a short preview (not the full list) of recent liturgies, linking out to the full list.

This replaces what `/` currently is (Feature 13's dashboard) — that full list moves to a new dedicated page (C).

---

## C. Liturgy Compiler page (new home for the current dashboard)

- Header row: "Liturgies" heading (left) + "New Liturgy" CTA (right), same line.
- Below: the full Liturgy History list, using the new naming convention (D).

---

## D. Liturgy naming convention

Format: `Lord's Day # | Worship Type | Sermon Text | Date`

**Dependency:** needs a minimal Sermon passage-reference field built first — Sermon currently has no structured data to pull "Sermon Text" from. Build just a `passage` field on Sermon now; full title + preacher can follow as its own later feature.

**Non-Sunday dates:** the "Lord's Day #" segment is omitted entirely from the display when the date isn't a Sunday — never computed-then-hidden, just absent. LD# is invariant: never recalculated, reset, or reassigned to a different date once set.

---

## E. Non-Sunday date handling (New Liturgy flow)

- `getLordsDayNumber()`'s computation is unchanged.
- New: warn when a non-Sunday date is picked in the date field; warn again beside the Start/Save button; require an explicit "Proceed anyway" click to actually save a non-Sunday liturgy.

**Clarified 2026-07-15** (the first implementation read this the other way and had to be corrected): the button-adjacent warning + "Proceed anyway" button are **not** both visible passively the moment a non-Sunday date is picked. The Start Liturgy button stays exactly as-is, labeled "Start Liturgy," until the user actually clicks it. Only then — if the date isn't a Sunday — does Start Liturgy grey out/disable and a separate "Proceed Anyway" button plus the note appear beside it. The date-field's own inline warning ("This date is not a Sunday…") is the only thing that shows passively on selection.

---

## F. Compile View & output format

### Morning — 2-page / 3-column layout (confirmed)

Applies to **both** the on-screen Compile View and the PDF export — both get rebuilt to this shape.

Structure: Page 1 / Page 2 divisions, each split into 3 columns, each Section its own box container within its assigned column.

| Page | Col 1 | Col 2 | Col 3 |
|---|---|---|---|
| 1 | Title/logo/date/LD# heading, Call to Worship, Prayer of Invocation, Psalm of Adoration | Righteousness of God, Call to Confession | Confession of Sin |
| 2 | Psalm/Hymn of Propitiation, Assurance of Pardon | Prayer for Illumination, Psalm/Hymn of Proclamation, Sermon | Psalm/Hymn of Dedication, Affirmation of Faith, Offertory & Thanksgiving, Pastoral Prayer, Charge, Benediction, Doxology |

### Vesper — decided

There's never been a physical Vesper bulletin, so the 3-column print-mimicking rationale doesn't automatically transfer. **Vesper's output becomes a shareable, mobile-first responsive web view instead of a PDF** — built now, as part of this same pass.

- **Editing (Compile View) stays consistent across both templates** — Vesper uses the same 2-page/3-column shape as Morning while compiling. Only the *final output* differs between templates.
- **Vesper's PDF export (Guide/Bulletin) is deferred to v3/v4** — not built in this pass. Morning keeps its existing PDF export (Features 11/12) unchanged.
- **New deliverable:** a public-facing, mobile-first responsive Liturgy Web View (e.g. `app/liturgy/[id]/view/page.tsx`) — distinct from the `lib/pdf/` pipeline, no download, shareable by URL. Scoped to Vesper for now; Morning could gain the same view later but that's not required by this pass.

---

## G. Reader — sticky Citation/Text panel

- Keep the "Compiling: …" banner as-is.
- Success message moves to *below* the Citation/Text block (was above).
- The Citation/Text block becomes sticky, left-aligned, top edge pinned to the top of the Bible body text.
- The reading column narrows/shifts to open real left-margin space — not an overlay.

---

## H. Marker redesign

- Addable "+": red glyph in a yellow box (was neutral gray box).
- Saved: green circle **superscript** (was a disabled button in a light-green square) — this is a mechanism change, not just color: superscript is a passive typographic mark, not an interactive element.
- Pending "−": not addressed — carrying forward the existing light-red treatment unless revisited later.

This overrides the neutral-gray/square-not-circle decisions made earlier in the build session (documented in `progress-tracker.md`'s marker-iteration history).

---

## I. Scripture Text Library ("Existing Selections")

- New table. Auto-saves every Selection on `+` marker click, regardless of whether the parent liturgy is ever saved.
- Scoped per-Section, same precedent as Formula/Prayer.
- Retention: save-always; orphaned entries from abandoned liturgies are accepted, flagged for a future manual cleanup tool (not built now).
- Lives inside the new **Browse Library** page.

---

## J. Browse Library page (new)

Merges: Formulas, Prayers (incl. new Prayer Guides, see W), Songs (Psalm + Hymn, see L), Existing Selections (I).

Same content also surfaces contextually as "Add X" buttons inside Sections where each type is applicable — see the full mapping (Y).

---

## K. Citation & Selection typography

- Universal citation formatting: small caps + a **new dedicated red token** (not reusing `--color-error`, to avoid the error/citation semantic collision).
- The original "Metrical Psalter = title case + italic + red" exception no longer applies to Selection — it now applies to the **Psalm item type's** title field specifically (see L), since Metrical Psalm became its own item type rather than a flagged Selection variant.

---

## L. New item types: Hymn and Psalm (shared "Songs" library)

- **HymnItem:** `title`, `author`, `year published`, `notes` (optional). Congregation-facing shows title only — title case + italic, no red (not Scripture).
- **PsalmItem:** `title`/reference (e.g. "Psalm 103:1-5"), `versification` (e.g. "Reformed Life Community Church"), `year published`, `notes` (optional). Congregation-facing shows title only — title case + italic + red.
- Single shared library ("Songs"), tagged by `kind: 'psalm' | 'hymn'`, Section-scoped like Formula/Prayer. More tag filters (v2/v3).
- Leader Guide shows full metadata; Bulletin shows styled title only — same visibility pattern as leader-only Verbal Cues.
- **These replace Selection entirely** in the 5 dynamic song Sections (Psalm/Hymn of Adoration, Propitiation, Proclamation, Dedication, Communion) — Selection no longer appears in those Sections at all.

---

## M. Long-reading Sections — approved

The Lord's Discourses, Words of Institution, and Closing of the Table are long readings where only the citation should be stored, not the full passage text. **Approved approach:** `SelectionItem.text` becomes optional — when blank, the Compile View and PDF show just the styled citation (e.g. "read in full") instead of a body-text block. Reuses Selection's existing citation/dedup/hover-preview machinery rather than a parallel item type for what's really the same content, just displayed differently.

---

## N–T. Section-specific content notes

- **Assurance of Pardon:** Selection (Proclamation) + Formula (Question/Response/Absolution/Seal) + Minister role tool.
- **Charge** (new, split from Morning's combined Section): Selection + Formula (framing words, before or after the reading) + Minister role tool.
- **Great Commission** (Vesper): Selection + Formula (same framing-words pattern as Charge) + Minister role tool.
- **Benediction** (both templates): Selection + Formula (Trinitarian closing formula) + Minister role tool.
- **Doxology** (both templates): Hymn (Songs library) — not Formula.
- **Confession of Sin (Morning):** Prayer type (corrected from Formula). Congregation-facing ending gets a Rubric-styled Verbal Cue: *"Tayo'y magkaroon ng tahimik at taimtim na paghahayag ng mga sala sa Diyos."* (Sentence case + italic.)
- **Words of Thanksgiving (Vesper):** Selection (+ Leader/Congregation tool) + Formula (for the closing Amen).
- **Offertory & Thanksgiving** (both templates): Selection, Verbal Cue, and Songs (Psalm/Hymn).
- **The Lord's Table (Vesper):** No item-picker at all — just the fixed heading "The Lord's Table" and a single administrator-name field (e.g. "Ptr. Rolando Ybamit").
- **Prayer Meeting (Vesper):** Heading only, nothing under it — the handbook itself says its rubrics are still forthcoming.
- **Affirmation of Faith / Church Covenant (Vesper):** Formula — and the Church Covenant portion (read responsively) needs the Leader/Congregation tool applied to Formula content, extending that tool beyond Selection for the first time.

---

## U. Leader / Congregation / Minister / Small Caps tool

- **Applies to:** Call to Worship and Prayer of Invocation (both templates, full replacement of bold-markdown need there); Church Covenant portion of Affirmation of Faith/Church Covenant (Vesper, extends the tool to Formula content).
- **Minister role** (third tag, distinct from Leader) scoped only to: Assurance of Pardon, Charge, Great Commission, Benediction.
- Everywhere else, `**bold**` markdown remains the live option, unchanged.
- **Storage:** separate structured span tags (start/end position + type), never baked into the raw saved text. Real data-model addition to whichever item types use it — Selection's `text`, and now Formula's `defaultText`/`overrideText` wherever this tool is enabled.

---

## V. Verbal Cue enhancements

- Placeholder text auto-substitutes real values from that Section's already-added content (e.g. real Hymn title/Psalm citation), sourced from a small stored per-Section sample-script template with `{title}`/`{citation}` tokens — not literal brackets.
- New "rubric style" flag (Sentence case + italic) for the one Confession-of-Sin case (see N–T).

### V.1 Default Verbal Cue at the start of every Section — decided

Every Section gets a default Verbal Cue at its start **except** the following explicit exclusions:

- **Morning:** Sermon, Pastoral Prayer, Benediction, Doxology
- **Vesper:** The Lord's Discourses through Closing of the Table (the whole Communion-administration run — Lord's Discourses, Words of Institution, Prayer before Communion, Hymn of Communion, The Lord's Table, Closing of the Table), Prayer Meeting, Benediction, Doxology

Confession of Sin (Morning) gets **both**: a default Verbal Cue at its *start* (this general rule) and the separate Rubric-styled Verbal Cue at its *end* (N–T) — two distinct cues in the same Section, not a conflict.

Assurance of Pardon (Morning) and The Great Commission (Vesper) **do** get the default Verbal Cue, despite the handbook's "Natural Transition" note for both — that phrase describes the handoff mechanic (no bridging announcement needed from the outgoing leader), not an absence of spoken content from whoever takes over next (the Minister still speaks the full dialogue/reading in both cases).

---

## W. Prayer Guides

New `guide` kind within the existing Prayer library (same table, tagged like Songs), Section-scoped, editable/addable via Browse Library — not hardcoded.

Sections needing a guide, per the handbook's own numbered structural checklists:

| Section | Guide elements |
|---|---|
| Prayer of Invocation | Adoration → Humble Approach → Acceptance → Thanksgiving → Trinitarian Conclusion |
| Prayer for Illumination | Petition for Understanding → Humble Submission → Focus on Christ |
| Prayer for Pardon (Vesper) | Lament → Confession → Supplication → Assurance → Trinitarian Conclusion |
| Prayer before Communion | Renunciation → Appeal → Petition → Mystical Union → Confirmation |
| Prayer after Communion (Closing of the Table) | Thanksgiving → Confession → Guidance of the Spirit → Hopeful Expectation |
| Pastoral Prayer | Thanksgiving for Worship → Consecration of Tithes → Prayer of Application → Intercessions & Petitions |

Prayer Meeting has no guide yet — the handbook itself marks its rubrics as forthcoming.

---

## X. Amen Rule

New small per-Section (specifically per-song-slot) metadata: does this piece customarily end in a sung Amen. **Leader Guide only — never shown in the Bulletin.**

---

## Y. Full Section → item-type mapping

### Morning Worship (18 Sections — see Z for the structural split)

Verbal Cue applies to every Section below **except** where noted "no Verbal Cue" (see V.1).

| # | Section | Item types |
|---|---|---|
| 1 | Call to Worship* | Selection (+ Leader/Congregation), Verbal Cue |
| 2 | Prayer of Invocation* | Selection (+ Leader/Congregation), Prayer (+ Guide), Verbal Cue |
| 3 | Psalm of Adoration* | Psalm, Hymn, Verbal Cue |
| 4 | Righteousness of God* | Selection, Verbal Cue |
| 5 | Call to Confession | Selection, Verbal Cue |
| 6 | Confession of Sin | Prayer, Verbal Cue (start) + Rubric-styled Verbal Cue (end) |
| 7 | Hymn of Propitiation* | Psalm, Hymn, Verbal Cue |
| 8 | Assurance of Pardon* | Selection, Formula (+ Minister), Verbal Cue |
| 9 | Prayer for Illumination | Prayer (+ Guide), Verbal Cue |
| 10 | Psalm of Proclamation* | Psalm, Hymn, Verbal Cue |
| 11 | Sermon | New minimal passage field — **no Verbal Cue** |
| 12 | Hymn of Dedication | Psalm, Hymn, Verbal Cue |
| 13 | Affirmation of Faith* | Formula, Verbal Cue |
| 14 | Offertory & Thanksgiving | Selection, Verbal Cue, Psalm/Hymn |
| 15 | Pastoral Prayer | Prayer (+ Guide) — **no Verbal Cue** |
| 16 | Charge* *(new)* | Selection, Formula (+ Minister), Verbal Cue |
| 17 | Benediction* *(new)* | Selection, Formula (+ Minister) — **no Verbal Cue** |
| 18 | Doxology* | Hymn — **no Verbal Cue** |

### Vesper Worship (19 Sections, unchanged count)

Verbal Cue applies to every Section below **except** where noted "no Verbal Cue."

| # | Section | Item types |
|---|---|---|
| 1 | Call to Worship* | Selection (+ Leader/Congregation), Verbal Cue |
| 2 | Prayer of Invocation* | Selection (+ Leader/Congregation), Prayer (+ Guide), Verbal Cue |
| 3 | Psalm of Adoration* | Psalm, Hymn, Verbal Cue |
| 4 | Confession of Sin | Selection (+ Leader/Congregation), Verbal Cue |
| 5 | Prayer for Pardon | Prayer (+ Guide), Verbal Cue |
| 6 | Words of Thanksgiving* | Selection (+ Leader/Congregation), Formula (Amen), Verbal Cue |
| 7 | Psalm of Proclamation* | Psalm, Hymn, Verbal Cue |
| 8 | The Lord's Discourses | Selection (reference-only, see M) — **no Verbal Cue** |
| 9 | Words of Institution | Selection (reference-only, see M) — **no Verbal Cue** |
| 10 | Prayer before Communion | Prayer (+ Guide) — **no Verbal Cue** |
| 11 | Hymn of Communion* | Psalm, Hymn — **no Verbal Cue** |
| 12 | The Lord's Table* | Heading + administrator name only, no item picker — **no Verbal Cue** |
| 13 | Closing of the Table | Selection (reference-only, see M), Prayer (+ Guide, "after Communion") — **no Verbal Cue** |
| 14 | Affirmation of Faith / Church Covenant* | Formula (+ Leader/Congregation on Covenant weeks), Verbal Cue |
| 15 | Offertory & Thanksgiving | Selection, Verbal Cue, Psalm/Hymn |
| 16 | Prayer Meeting | Heading only, nothing under it — **no Verbal Cue** |
| 17 | The Great Commission* | Selection, Formula (+ Minister), Verbal Cue |
| 18 | Benediction* | Selection, Formula (+ Minister) — **no Verbal Cue** |
| 19 | Doxology* | Hymn — **no Verbal Cue** |

---

## Z. Morning template structural change

"Charge & Benediction" splits into two separate Sections — "Charge" and "Benediction" — inserted where the combined Section currently sits, right before Doxology. Morning goes from 17 to 18 Sections.

**Migration handling:** one real liturgy already exists in the database. When this actually gets built, recheck the live liturgy count first and migrate that liturgy's `sections` rows correctly rather than assuming a clean insert — same precaution taken for the earlier Call to Confession insertion.

---

## AA. Morning Worship Visual Refinement (2026-07-15, Madrid's direct spec)

Applies to Morning's Compile View **and** its PDF export (Leader Guide/Bulletin) — both must match, per the standing invariant that the Compile View and PDF can never drift.

### Simplification
Strip Section cards down to plain print styling — no card border/shadow/background box. It should read like the actual printed bulletin, not an app UI.

### Buttons
- Relabel: "Add Selection" → **"+ Selection"**, "Add Prayer" → **"+ Prayer"**, "Add Verbal Cue" → **"+ Cue"**, "Add Formula" → **"+ Formula"**.
- Resize: 25% smaller than current.
- Restyle: rectangular outline, rounded corners, transparent fill (no solid background).
- Reposition: **below** the Section name, not beside it.

### Typeface
Ibarra Real Nova everywhere in the Compiler and its exports — no more Old Standard TT / Inter mixing for this surface.

- **Page title** ("Morning Worship Service"): ~14pt-equivalent, all caps.
- **Church logo**: ~2 inches.
- **Metadata** (date + Lord's Day #): Title Case Small Caps, e.g. "April 26, 2026" / "Lord's Day #17" — both centered relative to each other, both pushed to the far right edge of Column 1.
- **Section names**: bold, all caps.
- **Scripture references / song titles / creed titles**: same line as the Section name, Section name left-aligned, reference/title right-aligned — *unless* too long to fit without crowding the Section name, in which case it drops to its own line below the Section name.
- **Body size**: ~12pt-equivalent normal text; ~10pt-equivalent for references.
- **Scripture reference color**: `#C00000` (new literal red — distinct from every existing red token; needs to reconcile with §K's "new dedicated citation red token" decision, likely the same token, possibly the same hex).
- **Scripture references** (not Metrical Psalter/song refs): Title Case Small Caps, red.
- **Song item titles** (Psalm/Hymn): Title Case italic — no color rule stated, so presumably not red (distinct treatment from Scripture references).
- **Non-Scripture, non-song reference line** (e.g. a Creed's title): ~10pt-equivalent, normal style (not italic, not small caps), Title Case.
- **Sermon**: Scripture reference on the Section-name line (drops below if long, same rule as everything else); sermon title below that, centered relative to Column 2, Title Case Small Caps; preacher name below the title, ~10pt-equivalent.
- **Offertory Call**: reference only, never the Scripture body text.
- **Affirmation of Faith**: creed **title** only, never the full creed text — "Kredo ng Nicaea / Nicene Creed", "Kredong Apostolico / Apostles' Creed".

### Real dependency conflicts this surfaces, not yet resolved

1. **Song italic-title-case treatment and the Metrical-Psalm-title exception (§K) both presuppose the Psalm/Hymn item type (§L, Feature 21) exists.** Today, dynamic-naming Sections still use plain `SelectionItem` as a Psalm/Hymn stand-in (per `ui-registry.md`'s documented `SectionCard` note) — there's no `title`/`kind` field to apply "Title Case italic" to distinctly from a Scripture citation's "Title Case Small Caps, red" treatment. This spec can't be fully realized until Feature 21 ships.
2. **"Offertory Call reference-only" and "Affirmation of Faith title-only" are literally Feature 22's scope** (Reference-Only Selections & Section Content Corrections) — already planned, not new.
3. **The `#C00000` red and §K's "new dedicated citation red token, not reusing `--color-error`" are almost certainly the same decision, described twice** — needs reconciling into one token when Feature 24 (Citation Typography) is built, not two.
4. **Everything else — box simplification, button relabel/resize/reposition/restyle, Ibarra Real Nova unification, title/metadata/section-name typography, sermon layout — has no dependency and is fully buildable now** against the existing `SectionCard`/`LiturgyDocument` from Feature 17, without needing Features 21/22/24 first.

---

## AB. Reference sample bulletin — extracted ground truth (2026-07-16)

Madrid supplied `G:\My Drive\_Works\Liturgy\Reformed Life Bulletins\UPDATED SAMPLE Bulletin.docx` as the definitive target. Read directly via `python-docx` (real run-level formatting, not eyeballed). This **confirms and sharpens §AA** with exact values, and surfaces one real structural mismatch against what Feature 17 already built.

### Confirmed exact values (supersede §AA's approximations)

- **Page:** A4 **landscape** (11.69" × 8.27"), margins ~0.25in sides / ~0.3in top-bottom, **font Ibarra Real Nova throughout, no exceptions** — every run in the whole document uses it, including the title.
- **Title:** "MORNING WORSHIP SERVICE", bold, 14pt, all caps — confirmed exact size.
- **Metadata:** "August 2, 2026　Lord's Day #31" — one line, right-aligned, 12pt, small caps (not two separate centered lines — §AA described it as two lines centered to each other; the real sample is one right-aligned line with the date and LD# run together).
- **Section names:** bold, 12pt, all caps (not larger than body — same 12pt as body text, distinguished only by bold+caps).
- **Body text:** 12pt normal.
- **References/citations:** 10pt.
- **Citation color:** literal `#C00000` (confirmed, not a lighter/different red).
- **Citation styling has two distinct sub-cases, confirmed by real examples:**
  - Tagalog/plain Scripture citations (e.g. "Mga Awit 99:1-3", "Exodo 20:1-17", "2 Corinto 9:10-12"): red, **small caps**, not italic.
  - Metrical Psalm / English Psalter citations (e.g. "Psalm 111:1-5", "Psalm 119:33-40"): red, **italic**, *not* small caps. This is the real differentiator §K/§AA gestured at — it's not about the Section, it's about whether the citation is a Metrical Psalter reference specifically.
- **Song/Hymn titles** (not Scripture citations): italic, 10pt, **no color** (plain text color) — e.g. "Onward, Christian Soldiers" (Hymn of Dedication), "The Lord Bless You and Keep You" (Doxology). Confirms song titles are never red — only Scripture citations are.
- **Non-Scripture, non-song reference line** (Creed title): plain 10pt, normal style, Title Case, no color — e.g. "Kredong Apostolico" under Affirmation of Faith. Confirms §AA's rule.
- **Sermon layout, confirmed exact:** "SERMON" heading, then the Scripture reference red/small-caps/10pt on the same line via tabs (e.g. "Galatians 5:13-25"); below that, sermon title **centered**, 12pt, small caps, plain (not italic) — e.g. "How am I going to Live Out the Christian Life?"; below that, preacher name **centered**, 10pt, plain — e.g. "Bro. Jan Mark Niverba".
- **Offertory Call:** heading + red/small-caps/10pt reference only, confirmed — no Scripture body text at all, matching §AA and Feature 22's existing scope exactly.
- **Affirmation of Faith:** heading + plain 10pt creed title only ("Kredong Apostolico"), no creed body text — confirmed, matches §AA and Feature 22's scope.
- **Benediction:** reference on the Section-name line as usual; body text mostly plain, but **the trinitarian closing clause is bolded** within the same paragraph ("**Sa pangalan ng Ama, ng Anak, at ng Banal na Espiritu. Amen.**") — a real formatting detail not previously captured anywhere in this plan.
- **Leader/Congregation/Minister labels**, confirmed real usage: "**Ldr:**" and "**Min:**" — label itself small caps, **not bold**, rest of line normal weight. "**Congr:**" — label small caps **and bold**, and the **entire congregational response line is bold** (not just the label). This matches the project's existing "bold marks a congregational/unison response" convention (`markdown.ts`'s `**bold**` handling) almost exactly — the label-bolding is the one piece not yet covered by that mechanism.
- **New detail, not previously scoped anywhere:** a closing footer line, centered, bold italic, 10pt — "~ End of Morning Worship ~" — after the last Section (Doxology).

### Layout model — resolved 2026-07-16, no rework needed

Madrid's own bulletin-authoring process (typed directly in Word, using blank paragraphs to manually push Sections into the column he wants — not real column breaks; confirmed via the docx XML, zero `w:type="column"` markers exist) means the *reference sample's* column boundaries are hand-curated, not auto-flowed. Asked Madrid whether to switch to true CSS auto-flow or keep the fixed per-Section assignment; his answer: he wants exactly the curated "these Sections belong together in this column" control he already has in Word — i.e. **the fixed model, not auto-flow**.

Rendered the actual reference PDF (`soffice` + PyMuPDF, since the skill's default `pdftoppm` path wasn't available in this environment — `soffice.exe` converted the docx to PDF directly, `fitz`/PyMuPDF rasterized it) to check the real column boundaries against what Feature 17 already shipped. **They match exactly, no rework needed:**

| Page | Col 1 | Col 2 | Col 3 |
|---|---|---|---|
| 1 | Title/logo/metadata, Call to Worship, Prayer of Invocation, Psalm of Adoration | Righteousness of God, Call to Confession | Confession of Sin |
| 2 | Hymn of Propitiation, Assurance of Pardon | Prayer for Illumination, Psalm of Proclamation, Sermon | Hymn of Dedication, Affirmation of Faith, Offertory Call, Psalm of Thanksgiving, Pastoral Prayer, Charge, Benediction, Doxology |

This is identical to §F's table already implemented in Feature 17 — **Feature 17's fixed `page`/`column` data model is correct as-is** and needs no architectural change. Feature 28 Part A can proceed directly against the existing grouping.

**Two real naming/structural differences surfaced by the visual comparison — both resolved 2026-07-16:**
1. **"Confession of Sin" stays as-is** (Madrid: leave it — not renaming to "Corporate Confession of Sin" despite the reference sample's title).
2. **"Offertory & Thanksgiving" split into two separate Sections** — "Offertory Call" and "Psalm of Thanksgiving" — matching the reference exactly. Built: backed up the Morning template + all 5 liturgies' `sections` rows first (same practice as the Charge/Benediction split), then migrated. The two real liturgies with existing content there (2 Corinthians 9:6-8 and 9:9-11, both giving-related verses) had it preserved under the new "Offertory Call" — a reasonable, low-risk interpretation since both existing Selections are clearly offertory-admonition verses, not psalm/hymn content; "Psalm of Thanksgiving" starts empty for every liturgy since nothing distinctly psalm-of-thanksgiving-shaped existed in the combined Section before. Morning goes from 18 to 19 Sections. Verified live: all 19 headings render in the correct order, existing content intact, `tsc`/`next build` clean.

---

## New schema/tables this whole plan requires

1. `scripture_selections` (name TBD) — the Existing Selections library (I)
2. `songs` — shared Psalm/Hymn library, `kind` column (L)
3. `prayers` gains a `kind` column (`prayer` | `guide`) (W)
4. Sermon item type gains a `passage` field, minimum viable (D)
5. A `marks` field (structured span tags) on Selection and Formula content, for the Leader/Congregation/Minister/Small Caps tool (U)
6. `templates.sections` jsonb gains: page/column assignment (F), an item-type whitelist per Section (Y), and the Morning structural split (Z)
7. Static, code-level (not DB) per-Section lookups: Verbal Cue sample scripts (V), Amen Rule flags (X) — these don't change per-liturgy, so they don't need their own table
8. New route: `app/liturgy/[id]/view/page.tsx` — Vesper's public, mobile-first responsive Liturgy Web View (F), separate from the `lib/pdf/` pipeline. Vesper's PDF export is deferred to v3/v4, not built now.

---

## Status

Fully approved by Madrid, 2026-07-16. No open items. **Folded into `architecture.md`, `project-overview.md`, `ui-rules.md`, `ui-tokens.md`, and `build-plan.md` (new Phases 6-7, Features 15-27) as of 2026-07-16.** `ui-registry.md` intentionally not touched yet — it's an as-built component registry, updated only as each component is actually implemented, same as every prior feature.

**This file is now archival/reference** — the live source of truth for what to build is the five context files above. Read this document when you need the full reasoning/decision trail behind a choice; read the other context files for what's actually authoritative to implement against.

No code has been written yet. Next real step is implementation, starting at Phase 6, Feature 15 in `build-plan.md`.
