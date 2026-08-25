<!-- Project overview: what you're building, why, and who it's for -->

# Project Overview

## About the Project

A web application for Reformed Life Community Church that lets a liturgist compile Scripture, fixed liturgical formulas, and original prayer into a complete, coherent order of worship — with a built-in Bible reader, and dual Word (`.docx`) export for both the presiding leader and the congregation. (This repo is the production successor to an earlier version that exported PDF instead — see Tech Stack below.)

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
/liturgy/[id]            → Compile view: all Sections of the chosen template — Morning uses its fixed 2-page/3-column map; Vesper uses flat template order
/api/liturgy/[id]/export → Generate Leader Guide / Congregation Bulletin as .docx files, continuous-flow multi-column layout with manual column-break overrides (both templates). DOCX is the default. An explicit `?format=pdf` still reaches the buried legacy renderer, which is unlinked and carries no current product-support promise.
/liturgy/[id]/view       → Public, mobile-first responsive Liturgy Web View, no app nav chrome — shareable by URL and available for both templates alongside their DOCX exports
/library                 → Browse Library: Formulas, Prayers (+ Prayer Guides), Songs (Psalm/Hymn), Existing Selections — one merged page, superseding the old separate /formulas and /prayers
```

One route per distinct user activity — reading, compiling, exporting, managing reusable libraries. **v1.1 change:** the dashboard/history list moved from `/` to `/liturgies`, since `/` is now a proper marketing-style homepage; `/formulas` and `/prayers` were merged into one `/library` page rather than staying separate.

---

## Navigation

The application uses a floating navigation pill with permanent links to **Home**, **Liturgies**, **Bible Reader**, and **Library**, plus a **Create Liturgy** action and the signed-in account menu. It collapses to a mobile menu and is intentionally absent from the public Liturgy Web View. See `ui-rules.md` for the visual and responsive rules.

---

## Core User Flow

### Flow 1 — Starting a Liturgy

User opens `/liturgy/new`, selects Morning Worship or Vesper Worship, and picks a date. Lord's Day number computes automatically (count of Sundays since the first Sunday of that calendar year, no skips). A non-Sunday date warns immediately and requires explicit confirmation; the resulting liturgy never displays a Lord's Day number. The Compile View uses Morning's fixed two-page/three-column map and Vesper's flat template-order layout.

### Flow 2 — Compiling a Section

User browses the Bible reader (AB1905 or BSB, full text) or hovers a reference elsewhere in-app to preview AB2001/MBB via the BibleGateway widget. To add a Selection: highlight a passage in the reader, assign it to a Section — reference and citation tag auto-fills; the reader immediately shows a marker on any citation already used in that Section (dedup blocks an exact-match re-add), and every submitted Selection also joins the reusable Scripture Text Library regardless of whether the liturgy itself is ever saved. To add a Formula, Verbal Cue, Prayer, Psalm, or Hymn: pick an existing library entry or write a new one inline from `/library`, which joins the relevant library for future reuse (Formula stays a singular reusable entity with an editable default, not a library of variants; Prayer, Psalm/Hymn, and now Selection are all library-backed). **v1.1:** which of these item types a given Section even offers is now restricted per-Section (e.g. the five dynamic song Sections only offer Psalm/Hymn, never Selection) — see `context/redesign-plan-v1.1.md` §Y for the full mapping. Most Sections also offer a default Verbal Cue pre-filled from a per-Section bilingual sample script, auto-substituting real values (title/citation) already added to that Section.

### Flow 3 — Exporting

`/api/liturgy/[id]/export` generates two `.docx` files from the same data: the Leader Guide (every item, including leader-only material) and the Congregation Bulletin (leader-only material excluded). Word's own continuous-flow multi-column layout uses a manual "start new column" override per Section where needed and works for both templates. `/liturgy/[id]/view` remains available for either template as a shareable, mobile-first responsive web page.

---

## Data Architecture

### Liturgy
- Lives in Postgres (Supabase), one row per compiled service instance
- Changes each time a Section's items are added, edited, or reordered within v1's fixed structure
- Used for: compiling, history, both DOCX audiences, the public Web View, and the frozen legacy PDF route
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
- `is_guide` independently identifies a fixed structural checklist (e.g. Invocation's Adoration → Humble Approach → Acceptance → Thanksgiving → Trinitarian Conclusion) shown as reference next to "Add Prayer" on Sections that have one, never stored as placed liturgy content

### Songs — Psalm and Hymn (library, v1.1)
- One shared library, tagged by kind (`psalm` | `hymn`), scoped per-Section like Formula/Prayer
- Psalm: title/reference, versification, year published, notes. Hymn: title, author, year published, notes. Neither stores lyric/body text
- Congregation-facing output shows the title only (Psalm: title case, italic, red; Hymn: title case, italic); Leader Guide shows full metadata

### Scripture Text Library ("Existing Selections", v1.1)
- Every Selection submitted via the Reader's marker joins this library automatically, scoped per-Section, regardless of whether the liturgy itself is ever saved
- No cleanup logic in v1 — orphaned entries from abandoned liturgies are accepted as a known tradeoff

---

## Shipped Product

- Bible reader: AB1905 + BSB, full text, book/chapter navigation, verse highlighting
- Hover preview for AB2001/MBB via BibleGateway's RefTag/BGLinks widget (licensed display, not extracted text)
- Selection creation with citation tagging (en-dash-normalized) and exact-match dedup per Section; every submitted Selection also joins a reusable Scripture Text Library
- Six-part item model: Selection, Formula, Verbal Cue, Prayer, Sermon, Song (Psalm/Hymn) — restricted per-Section by an item-type whitelist; every item type deletable, most editable in place
- Fixed Morning Worship / Vesper Worship templates, posture shown as a trailing asterisk, dynamic Psalm/Hymn Section naming; Morning's "Charge & Benediction" and "Offertory & Thanksgiving" both split into two Sections each
- Computed Lord's Day numbering (auto, resets each January, never skips); non-Sunday dates require explicit confirmation and never display an LD#
- Liturgy history, with a dedicated homepage separate from the full list
- Both templates: dual DOCX export (Leader Guide and Congregation Bulletin), using continuous-flow Word columns with optional manual Section breaks
- Both templates: a shareable, mobile-first, nav-free public Liturgy Web View
- Morning only: a frozen legacy PDF export, still served by the export route but no longer linked from the UI
- Leader/Congregation/Minister/Small-Caps responsive-reading tool — Congregation/Minister on the Sections that alternate speaking parts, Small Caps available anywhere a Selection can go; reaches both Selection and Formula content
- Prayer Guides — fixed structural checklists for extemporaneous prayers, shown as reference on Sections that have one, and included in the exported Leader Guide
- Trinitarian Seal — a Benediction toggle for Selection or Formula content, appending the approved Filipino/English closing wording in the same flowing paragraph

## Features Out of Scope (v1)

- Section reordering, renaming, or creation beyond the Morning content-model corrections already made — v3
- Verse tags, coherence score, universal search, cross-day duplicate flagging — v3+
- Reformed Life PowerPoint Builder integration — v3+
- Complete Vesper recurring-reading automation — partially shipped in v2 and still open for the canonical scheduling/placement corrections described in the roadmap below
- New PDF development — the PDF path is frozen; active output development uses DOCX
- An MBB hover-preview toggle alongside AB2001 — the widget only supports one active translation at a time; a real toggle needs its own design work, not scoped yet
- Extraction/storage of AB2001 or MBB text into the app's own database — pending Philippine Bible Society response; hover-widget display only until then

---

## Tech Stack

- **Frontend:** Next.js
- **Backend:** Next.js (API routes / server actions)
- **Database:** Supabase (Postgres) — relational Liturgies/Templates/Sections and one polymorphic `section_items` child table with typed JSON payloads
- **Auth:** Supabase Auth with Curator and Compiler roles; public reading remains anonymous while mutations require a trusted account
- **Word (.docx) export:** the `docx` npm library — continuous-flow, multi-column layout with manual column-break overrides, both templates. Replaces the original PDF export as the active mechanism.
- **PDF export (legacy, buried cold):** @react-pdf/renderer — reachable only through explicit `format=pdf`, unlinked from the UI, and not a supported source of current product requirements
- **Styling:** Tailwind CSS v4
- **Bible text:** AB1905 + BSB self-hosted/API for the reader; BibleGateway RefTag/BGLinks widget for AB2001/MBB hover preview

---

## Analytics Events

No application analytics events are defined. Optional platform performance telemetry does not track product-domain actions.

---

## Target Users

Trusted RLCC Curators and Compilers prepare Morning or Vesper liturgies. Congregation members and other anonymous visitors can read public Home, Library, Reader, and Liturgy Web View pages without an account.

---

## Success Criteria

- A trusted Compiler can compile a real Sunday liturgy end to end — selecting or adapting Scripture and assigning Selections, Formulas, Verbal Cues, Prayers, Sermon text, and Songs across either template
- Leader Guide and Congregation Bulletin DOCX files export correctly from the same compiled liturgy, and the public Web View presents the same content without compiler navigation

---

## Roadmap — v2 and v3

This is the approved roadmap. See `build-plan.md`'s v2 and v3 sections for the implementation-level breakdown.

### v2 — Translation Breadth, Output, & Library Completeness

Template/Section editing belongs to v3 because it requires independent scoping and builds on row-based Item storage. v2 delivered a second Scripture translation (BSB/English alongside AB1905/Filipino), DOCX output, and library completeness.

1. **Docx export — ✅ done, shipped 2026-07-22.** Replaced `@react-pdf/renderer` as the active export mechanism, built in this repo (the clone that item was scoped for). PDF export is frozen, not deleted — still present, no longer linked from the UI.
2. **Continuous-flow authoring with manual column-break overrides — ✅ done, shipped alongside #1.** Resolved the old fixed-vs-continuous DOCX question in favor of continuous flow — Word's native multi-column layout already behaves this way, and a manual override is just a real column-break, no custom pagination engine needed. Vesper's DOCX uses that same continuous multi-column model without changing its flat Compile View.
3. **BSB (English) as a real second Selection source — ✅ done.** The Reader, Scripture Library, companion-translation flow, and Compile View picker are translation-aware.
4. **Automated rotation-cycle assignment — partially shipped, corrections open.** The canonical `Vesper Service and Lord's Table.docx` defines the 12 Lord's Discourses and their Closing texts, the four Words of Institution readings, and a separate four-Sunday Great Commission Text cycle. Current code auto-places the Discourse, Words of Institution, and Closing selections and provides an override path. It computes but does not place the Great Commission Text, while the calendar-quarter anchor and fifth-Sunday behavior are not stated in the canonical document and require a deliberate decision before this item can close.
5. **Library-level marking toolbar — ✅ done.** Formula and Scripture Library marks copy onto a new placement as an editable starting point.
6. **Default Verbal Cue seeding — ✅ done, shipped 2026-07-22** with approved cue content. Legacy Formula-text cleanup of Absolution's manually typed "Minister:"/"Congregation:" prefixes remains an open, non-blocking manual content task.

**Shelved cold:** an MBB hover-preview toggle and any further development of the frozen PDF path.

### v3 — Structure, Multi-User, & Discovery

The remaining v3 throughline is editable Template structure and discovery. Multi-user authorization and queryable Item storage shipped ahead of the remaining work.

1. **Item storage migration — ✅ done.** `section_items` is the live storage model; the old `sections.items` column has been removed.
2. **Template/Section editing** — reorder, rename, create Sections within a Template. Moved from v2; still needs its own scoping pass before any code, given how every past structural Template change needed a hand-written re-indexing migration.
3. **Items tagging** — useful for #4 below.
4. **Universal search + cross-day duplicate flagging**, depending on #3.
5. **Coherence score**, depending on #3-4's query layer.
6. **Supabase Auth + Curator/Compiler access control — ✅ done.** Trusted mutations are authorized server-side; anonymous reading remains public.
7. **Reformed Life PowerPoint Builder integration** — external system, needs its own scoping conversation with whoever owns that tool. Confirmed for after v2 completes.
8. **AB2001/MBB text extraction into this app's own database** — still gated on Philippine Bible Society's reply to the adaptation-rights request. A separate tool for personal-use extraction is known to exist, but personal use and this app storing/serving that text to a congregation are different situations — the former doesn't resolve the latter's actual gate.

**Removed from the roadmap entirely:** Vesper's PDF export — moot once PDF export itself is being phased out in favor of docx.
