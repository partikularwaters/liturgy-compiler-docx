# UI Registry

Current catalog of reusable UI components and established cross-component patterns. Read this before building a component; match an existing pattern before adding a new one. Historical build narrative belongs in `context/overflow/session-notes/`, not here.

---

## How to Use

1. Find the nearest existing component or pattern below.
2. Confirm its current implementation and tokens in source.
3. Reuse or extend it without changing established domain vocabulary.
4. Record only the resulting current pattern here; do not append session chronology.

---

## Established Cross-Component Patterns

### Library-backed create, edit, and place

Formula, Prayer, Song, and Scripture Selection flows separate four operations:

- browse/filter candidates for the target Section;
- create a new library entry;
- edit an existing library entry when its submitted fields actually changed; and
- place the chosen entry into the current Liturgy.

Selecting an existing entry does not authorize or imply editing it. Placement actions are distinct from library write actions. Formula, Prayer, and Song actions validate the chosen row's Section scope on the server. The existing-Scripture flow filters candidates by Section in the UI, then validates the destination Section and citation on the server without re-fetching the selected library row.

Formula, Prayer, and Song create/inline-edit surfaces reuse their type-specific form component with prop-driven mode, defaults, and submission behavior. Scripture is the deliberate current exception: creation uses `ScriptureSelectionForm`, while `ScriptureSelectionRow` owns its inline editor. Shared/My/New modes stay explicit where ownership applies; a Compiler may place permitted shared material without gaining Curator edit authority.

### Refresh-safe local forms

Components that call `router.refresh()` preserve local edit state unless a stable semantic key changed. Effects never reset merely because refreshed Server Components produced new object or array references.

### Compiled-content rendering

`resolveItemText`, `sectionTitle`, text-mark helpers, and `prepareSectionRender` carry content decisions across DOCX, legacy PDF, and Web View. `SectionCard` mirrors the same decisions with editing-aware branches. Any change to header references, merged Selections, visibility, or marks is applied and regression-tested in both the shared read-only path and Compile View.

### Small controls and semantic colors

Use the exact foreground/background pairing from `ui-tokens.md`, then verify computed contrast in the rendered state. Radius follows actual control size: compact square controls use `rounded-sm`, compact text controls use `rounded-md`, and badges use `rounded-full`.

---

## Application Chrome

### TopNav / TopNavLinks / AccountMenu

- `components/layout/TopNav.tsx`
- `components/layout/TopNavLinks.tsx`
- `components/layout/AccountMenu.tsx`

Floating, responsive navigation with Home, Liturgies, Bible Reader, Library, Create Liturgy, and account actions. Desktop uses the centered pill; mobile uses the menu variant. The pill hides on downward scroll and returns near the page top or on upward scroll. Route changes close the mobile menu but do not otherwise reset scroll-hidden state. `TopNavLinks` renders no application navigation on `/liturgy/[id]/view`.

### ScriptureLinker

`components/layout/ScriptureLinker.tsx` mounts the BibleGateway display-only linker once and rescans after route changes. It renders no project UI of its own and never stores AB2001/MBB text.

---

## Liturgy Composition

### SectionCard

`components/liturgy/SectionCard.tsx` is the editing-aware Compile View surface. It renders the permitted add controls from the Section whitelist, placed Item controls, header references, merged Selections, Prayer Guides, and per-Item edit/delete affordances. It uses the plain bulletin-like Section treatment rather than the generic card surface.

An empty Section renders its heading and available add controls only. Item deletion always routes through the generic remove action.

### Add panels

- `components/liturgy/AddExistingSelectionPanel.tsx`
- `components/liturgy/AddFormulaPanel.tsx`
- `components/liturgy/AddPrayerPanel.tsx`
- `components/liturgy/AddSelectionPanel.tsx`
- `components/liturgy/AddSongPanel.tsx`
- `components/liturgy/VesperReadingPanel.tsx`

Panels follow the library-backed create/edit/place pattern above. Candidate lists are Section-scoped. Existing-entry selection remains distinct from authoring a new entry or changing a library row.

### Item edit/forms

- `components/liturgy/SelectionEditForm.tsx`
- `components/liturgy/FormulaEditForm.tsx`
- `components/liturgy/VerbalCueForm.tsx`
- `components/liturgy/SermonForm.tsx`

Placed-Item editors change the placement unless the UI explicitly invokes a library edit action. Formula overrides remain per-instance. Prayer/Song display data comes from the placement snapshot.

### MarkEditor / MarkedText / CitationField

- `components/liturgy/MarkEditor.tsx`
- `components/liturgy/MarkedText.tsx`
- `components/liturgy/CitationField.tsx`

Marks remain structured offsets separate from raw prose. Congregation and Minister are mutually exclusive speaker marks; Bold and Small Caps are independent overlays. The live preview remains available even when only universal marks apply. Citation display uses the shared formatting/linking behavior and citation token.

### LiturgyWebView

`components/liturgy/LiturgyWebView.tsx` is the public, responsive, nav-free read surface for both templates. It consumes the shared read-only render preparation and ignores Compile View page/column editing layout.

### Supporting controls

- `components/liturgy/CopyLinkButton.tsx` — copies the public Web View URL and exposes success feedback.
- `components/liturgy/EndNoteToggle.tsx` — controls the authored output end note.
- `components/liturgy/LiturgyDateRow.tsx` — shared liturgy date/status row.
- `components/liturgy/LordsDayDatePicker.tsx` — date selection with Sunday warning and Lord's Day display suppression.
- `components/liturgy/PrayerGuidePanel.tsx` — reference-only guide display; never a placed Prayer.
- `components/liturgy/ScriptureCitationLink.tsx` — translation-aware citation/context link.
- `components/liturgy/TemplatePicker.tsx` — selected state uses border rather than colored fill.
- `components/liturgy/icons.tsx` — project icon exports backed by Tabler; add new shared icons here.

---

## Library Management

### Type-specific forms and rows

- `components/formulas/FormulaForm.tsx`
- `components/formulas/FormulaListRow.tsx`
- `components/prayers/PrayerForm.tsx`
- `components/prayers/PrayerListRow.tsx`
- `components/selections/ScriptureSelectionForm.tsx`
- `components/selections/ScriptureSelectionRow.tsx`
- `components/songs/SongForm.tsx`
- `components/songs/SongListRow.tsx`

Formula, Prayer, and Song forms are reused by their create page and inline row editor. Scripture creation uses `ScriptureSelectionForm`; `ScriptureSelectionRow` implements its own inline editor. Rows own display/edit state and respect ownership/role affordances supplied by server-authorized page data.

### Shared library components

- `components/library/BilingualGrid.tsx` — paired-language presentation.
- `components/library/LibraryTextPreview.tsx` — consistent marked-text preview for library prose.
- `components/library/TranslationPairFields.tsx` — translation and companion-pair controls.

Do not duplicate bilingual pairing fields or preview rendering inside type-specific rows.

---

## Reader

### BookChapterPicker / HighlightColorPicker

- `components/reader/BookChapterPicker.tsx` uses standard form-input tokens for book/chapter navigation.
- `components/reader/HighlightColorPicker.tsx` uses semantic token swatches with a ring for the active choice.

### ReaderTargetPicker

`components/reader/ReaderTargetPicker.tsx` selects the destination Liturgy/Section without moving Section-scope authority into the client.

### VerseDisplay

`components/reader/VerseDisplay.tsx` owns the reading surface, highlights, and verse marker states. Addable/pending markers are compact square buttons; a saved marker is passive typography, not a disabled button. Text highlighting and Selection-building remain separate click targets.

When compiling, `app/reader/ReaderClient.tsx` uses the sticky composition panel beside the reading column. Plain Reader browsing remains a single reading column.

---

## Generic UI

### Modal

`components/ui/Modal.tsx` is the shared visual overlay. It closes through its close button or an outside click and uses the tokenized modal surface. Full dialog accessibility remains open: add dialog semantics, Escape dismissal, initial focus, focus containment, and focus restoration before treating it as an accessible dialog primitive.

---

## Output Components

Active Word generation lives in `lib/docx/LiturgyDocx.ts`; it is one audience-parameterized implementation for both templates. The buried PDF compatibility component lives in `lib/pdf/LiturgyDocument.tsx` and is explicit-opt-in only. Neither is a DOM UI component, but both consume the same shared content decisions recorded above.
