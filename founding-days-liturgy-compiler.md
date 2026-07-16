# Founding Days — Project Clarity Document
## Project: Liturgy Compiler (working title)

---

## 1. Purpose

Liturgists have an inexhaustible resource — the Scriptures — but no dedicated tool for compiling that resource into a coherent order of worship. Current practice (Docs, Sheets, loose notes) has two structural failures:

1. **No unified view.** The person crafting the liturgy cannot see Call to Worship through Benediction as one continuous whole while writing it. Coherence has to be held in the crafter's head.
2. **Default to precedent, not intent.** Without a system that surfaces what's already been used and why, the person assigned to write the liturgy tends to reuse prior selections rather than choosing verses that build the day's arc on purpose.

A third failure surfaced during scoping: even when a verse is chosen well, nothing records *how it's meant to be used* — line divisions for responsive reading, adaptation of wording for clarity, or the fixed liturgical formulas that surround it (e.g., the Question/Response/Absolution structure of the Assurance of Pardon). A compiled verse with no usage record forces the next person to guess at reasoning they weren't there for.

The app exists to solve all three: a built-in Bible reader for sourcing text, a compiler that assembles a full liturgy into one visible, exportable whole, and a data model that carries *how* each piece is meant to be spoken, not just *what* it is.

**Standard set by this project:** the tool must produce a result equal to or better than the current manual process — full dialogical structure, fixed formulas, and adapted Scripture preserved exactly as required — before it counts as viable. Ease of use is a bonus on top of that floor, not a substitute for it.

---

## 2. Users

The app serves whoever prepares liturgical content — which may be one person (solo prep) or split across roles (e.g., a deacon assembling their assigned portion, a preacher supplying sermon text/passage). The tool supports both patterns without requiring multi-user infrastructure in v1 — see Constraints (§7) and Definition of Done (§8).

---

## 3. Scope

### v1 — Fixed Structure, Dual Output

- Bible reader: browse by book/chapter, read text.
- Highlight verses with selectable colors.
- Save a Scripture-sourced item (a **Selection**, §5) into a specific liturgy Section.
- **In-reader marker**: any citation already saved to a Section shows an identifying icon/legend in the reader — driven by the citation tag, not the displayed wording (see §5), so adapted or partial text still registers correctly.
- **Dedup rule**: a citation tag cannot be added twice to the *same Section* if it's an exact match (e.g., Ps 95:1–2 saved once, cannot be saved again). A different range is a distinct, permitted entry, even if it overlaps (Ps 95:1–4 ≠ Ps 95:1–2).
- **Mixed content per Section**: a Section holds an ordered list of items, one of four types:
  - **Selection** — Scripture-sourced, carries a citation tag.
  - **Formula** — canon, fixed liturgical text (Question, Response, Absolution, Seal, Confession, Creeds). Editing should eventually be restricted to an authorized set of people (see v3+, §3); v1 tags items as Formula now so that restriction has something to attach to later, even though enforcement isn't built yet.
  - **Verbal Cue** — loose guidance for the presider (e.g., "Let us sing [Title]. Hear the Word of God from [citation]..."). Not canon, editable by anyone, may or may not be followed as written.
  - **Prayer** — freely composed text, held as a small reusable library per Section rather than a single slot (e.g., 2–3 existing Confession of Sin prayers). Compiling a liturgy means picking one, editing one, or writing a new one that joins the library for future use. No canon status, no access restriction — anyone can add or edit.
- **Markdown-sensitive text entry**: items support markdown; bold marks a congregational/unison response, plain text marks the leader's part — consistent with the existing bulletin's own convention.
- **Fixed liturgy templates**: two hardcoded service structures, Morning Worship and Vesper Worship, selected when starting a new liturgy — see §6.
- **Posture**: not stored as data. Displayed as a single trailing asterisk on a Section's title for standing, no asterisk for seated — fixed per Section at the template level.
- **Dynamic Psalm/Hymn naming**: for song Sections (e.g., "[Psalm/Hymn] of Proclamation"), the prefix is computed from what's actually selected that week — a metrical Psalm yields "Psalm of...", a hymn yields "Hymn of...". Not stored as fixed text.
- **Lord's Day numbering**: computed automatically from a selected date — count of Sundays from the first Sunday of the calendar year, resetting every January. Increments every Sunday without exception, including weeks with no service.
- **Formulas as reusable entities**: each Formula (e.g., the Absolution) is stored once with an editable default. Placing it into a liturgy either uses the default as-is or overrides it for that instance — the master default is not silently altered by a one-off edit (exact override mechanics are a schema-stage decision).
- Assemble a complete liturgy across all Sections of the chosen template.
- Save liturgy history (past compiled liturgies, retrievable).
- **Dual PDF export**, generated from one compiled liturgy:
  - **Leader Guide** — all items, including leader-only Verbal Cues.
  - **Congregation Bulletin** — all items *except* leader-only Verbal Cues — matching the bare-liturgy format already in use.
  - Per-item visibility flag (both / leader-only) drives the difference — not a separate comments layer.
  - Single-column layout for v1 (the current three-column bulletin format is a possible later refinement, not required now).
- **Storage**: hybrid schema — relational tables for Liturgies/Templates/Formulas, with Items stored as structured data within each Section. Detailed design deferred to CTP.

### v2 — Structural Flexibility

- User-defined Section order (reorder within a template).
- User can create new Sections and rename existing ones.
- Templates become editable rather than fixed.

### v3+ — Parking Lot

- Tags on Selections for filtering the saved collection.
- Coherence score / signal for whether a day's liturgy holds together.
- Universal search across the compilation, tags, and the Bible text itself.
- Cross-day duplicate **flagging** (not blocking) — surfacing that a citation was used for a given Section on a prior date, across both Morning and Vesper liturgies.
- Integration with the separately-built "Reformed Life PowerPoint Builder" webapp for collaboration.
- **Role-based access control** — restrict Formula edits to an authorized set of people, with a higher-approval tier for certain changes; Verbal Cues and Prayers remain open to all. Requires multi-user infrastructure not built in v1; v1's Formula/Verbal Cue item-type split (§3) lays the groundwork.
- Automated rotation-cycle assignment for Vesper's recurring reading series (Lord's Discourse — quarterly, 12-text cycle; Words of Institution — monthly, 4-text cycle; Closing of the Table — paired to whichever Discourse is assigned; Great Commission — monthly cycle) — currently tracked by a fixed lookup table, not automated in v1.

---

## 4. Data Model Implications (carried into CTP, not resolved here)

- A **Liturgy** = one instance of a Template (Morning or Vesper) for a specific date, with a Lord's Day number.
- A **Template** = the ordered list of Sections for a service type. Fixed in v1, editable in v2.
- A **Section** = a named slot in a Template (e.g., "Confession of Sin"), holding an ordered list of items. Posture is a fixed display property of the Section at the template level, not per-liturgy data.
- An **item** is markdown text with an *optional* citation tag:
  - Citation present, text auto-pulled and unedited → a clean Selection.
  - Citation present, text hand-typed or edited → a Selection covering a partial range, a non-contiguous set, or Scripture adapted for clarity (e.g., pronoun changes) — still tagged for traceability and dedup.
  - No citation → a Formula (canon, access-restricted in a future version), a Verbal Cue (loose presider guidance, freely editable), or a Prayer (freely composed, held in a per-Section library of prior entries to pick from, edit, or add to — no canon status, no access restriction).
- Formulas and Verbal Cues both carry a **visibility flag** (both / leader-only) that drives the Guide/Bulletin export difference — Verbal Cue narration is leader-only; dialogical Formulas like Question/Response are shown in both.
- The **Sermon** Section is a distinct case: it holds a passage reference, a sermon title, and a preacher/speaker name — not a liturgical text selection.
- Hymns are referenced by **title and source only** (e.g., "Rock of Ages — Isaias 26:4"), not by storing lyric text, consistent with copyright practice already reflected in the current bulletin.
- Multi-part Sections (e.g., Assurance of Pardon's Proclamation → Question → Response → Absolution → Seal) require no special modeling — they're simply several ordered items within one Section, which the existing item-list structure already supports.

---

## 5. Terminology — Settled and Open

| Term | Status | Definition |
|---|---|---|
| **Selection** | Settled | A Scripture-sourced item — clean reference or hand-adapted, always carries a citation tag |
| **Formula** | Settled | Canon, fixed liturgical text (Question, Response, Absolution, Seal, Confession, Creeds); stored once with an editable default; edits to be access-restricted in a future version |
| **Verbal Cue** | Settled | Loose guidance for the presider, bridging narration between Sections; not canon, freely editable by anyone, may or may not be followed |
| **Prayer** | Settled | Freely composed text held in a per-Section library of prior entries — pick, edit, or add — no canon status, no access restriction |
| **Section** | Settled | A named slot in a liturgy Template |
| **Corpus** | Settled | The whole verse-and-text repository the reader marks against |
| **Guide** / **Bulletin** | Settled (scope) | v1 produces both from one compiled Liturgy: Guide = all items including leader-only Verbal Cues; Bulletin = same, minus leader-only Verbal Cues |

---

## 6. Fixed Liturgy Templates (v1)

### Morning Worship — Liturgy of the Word

1. Call to Worship*
2. Prayer of Invocation*
3. Psalm of Adoration*
4. Righteousness of God*
5. Call to Confession
6. Confession of Sin
7. Hymn of Propitiation*
8. Assurance of Pardon*
9. Prayer for Illumination
10. Psalm of Proclamation*
11. Sermon
12. Hymn of Dedication
13. Affirmation of Faith*
14. Offertory & Thanksgiving
15. Pastoral Prayer
16. Charge & Benediction*
17. Doxology*

*(Added 2026-07-12, post-launch: "Call to Confession" was missing from the original scoping — Morning Worship only, seated, immediately before Confession of Sin.)*

### Vesper Worship — Liturgy of the Table

1. Call to Worship*
2. Prayer of Invocation*
3. Psalm of Adoration*
4. Confession of Sin
5. Prayer for Pardon
6. Words of Thanksgiving*
7. Psalm of Proclamation*
8. The Lord's Discourses
9. Words of Institution
10. Prayer before Communion
11. Hymn of Communion*
12. The Lord's Table*
13. Closing of the Table
14. Affirmation of Faith / Church Covenant*
15. Offertory & Thanksgiving
16. Prayer Meeting
17. The Great Commission*
18. Benediction*
19. Doxology*

*(asterisk = standing, per §3; postures drawn from the Handbook for Leading Worship, v1.1)*

These two templates are the entirety of the fixed structure for v1. Sections are not reorderable, renameable, or creatable by the user until v2.

---

## 7. Constraints

- Solo build, AI-assisted.
- No hard deadline.

---

## 8. Definition of Done (v1)

Madrid personally compiles a real Sunday liturgy — selecting and adapting Scripture through the reader, assigning Selections and Formulas to Sections of either the Morning or Vesper template, writing any needed custom prose and rubrical notes — and exports both a Leader Guide and a Congregation Bulletin as PDFs from that single compiled liturgy, start to finish, in one sitting.

---

## 9. Settled Deferrals (not open — correctly waiting for a later stage)

- **Detailed hybrid schema design** (table structure, Formula override mechanics) — CTP/build-stage work by nature, not a scoping gap.
- **Three-column Bulletin layout** — v1 ships single-column by decision; the richer layout is a later refinement, not an unresolved question.

## 10. Handoff

Founding Days scoping is complete. Track decision for CTP: **Track B (Full)** — the item taxonomy (Selection / Formula / Verbal Cue / Prayer, each with different governance), dual PDF export, hybrid schema, computed Lord's Day dates, and dynamic Section naming exceed Track A's scope.
