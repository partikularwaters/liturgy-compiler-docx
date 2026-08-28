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

Interactive states (2026-08-27, emil-design-eng Phase 1 — see `ui-rules.md`'s Motion & Animation section for the actual tokens/timing): every nav link and icon has a hover-color state; the hamburger, account-menu, and Create-Liturgy buttons have press feedback; the account-menu and mobile-menu dropdowns are origin-aware (scale in from their own trigger corner, never from center) with an entrance transition. This is the reference implementation for hover/press/entrance states going forward — match it rather than reinventing the pattern per component.

### ScriptureLinker

`components/layout/ScriptureLinker.tsx` mounts the BibleGateway display-only linker once and rescans after route changes. It renders no project UI of its own and never stores AB2001/MBB text.

---

## Liturgy Composition

### SectionCard

`components/liturgy/SectionCard.tsx` is the editing-aware Compile View surface. It renders the permitted add controls from the Section whitelist, placed Item controls, header references, merged Selections, Prayer Guides, and per-Item edit/delete affordances. It uses the plain bulletin-like Section treatment rather than the generic card surface.

An empty Section renders its heading and available add controls only. Item deletion always routes through the generic remove action.

**Only one Add panel or item editor is ever open per Section (2026-08-27).** `SectionCard` holds one `openTarget` state, not one boolean per panel type — opening or editing anything replaces whatever was open, it never stacks. Switching away from a panel with unsaved input (tracked via a capture-phase input/change listener, not a prop from each child) confirms before discarding; re-clicking the open trigger to close it goes through the same dirty check. Any future panel or editor added to `SectionCard` should route its open/close through `requestOpenChange`/`closeOpenTarget`, not a new independent `useState`. **Known gap, accepted by design:** the dirty check only sees `<input>`/`<select>`/`<textarea>` changes — a plain `<button>`-driven choice inside a panel (a mode-switch button, `AddExistingSelectionPanel`'s Trinitarian Seal cycle button, a mark toggle) won't register as dirty on its own. `survey`-confirmed 2026-08-27 as an accepted tradeoff, not a defect — instrumenting every button-based choice would mean touching all ~13 Add-panel/edit-form files individually, which the capture-phase approach was chosen specifically to avoid.

Interactive states (2026-08-27, emil-design-eng Phase 2 — see `ui-rules.md`'s Motion & Animation section for tokens/timing): the shared `addButtonClass` const (every "+ X" trigger) has hover-color and press feedback — one edit covers all call sites, the reference pattern for any future shared button-class const. Pencil/Trash icon buttons have a hover-color transition only, deliberately no press-feedback scale (a bare small icon with no background reads as jitter, not feedback, at that treatment — judgment call, revisit if it looks wrong in practice). Every Add-panel/edit-form mount point gets a restrained fade-in entrance, not an instant pop.

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

**Save/Cancel button pair** (2026-08-27, emil-design-eng Phase 2): this exact button pairing is not a shared component — its `className` is repeated verbatim across every Add panel and edit form above, plus `SectionCard`'s own inline `PrayerEditForm`/`SongEditForm`. All 23 occurrences now carry the same press-feedback recipe as `addButtonClass`. Treat this as the reference pattern until (if ever) it's extracted into a real shared `Button` component — apply the same recipe to any new occurrence rather than reinventing it.

### MarkEditor / MarkedText / CitationField

- `components/liturgy/MarkEditor.tsx`
- `components/liturgy/MarkedText.tsx`
- `components/liturgy/CitationField.tsx`

Marks remain structured offsets separate from raw prose. Congregation and Minister are mutually exclusive speaker marks; Bold and Small Caps are independent overlays. The live preview remains available even when only universal marks apply. Citation display uses the shared formatting/linking behavior and citation token.

Interactive states (2026-08-27, emil-design-eng Phase 2): every toolbar toggle button (Bold, Small Caps, exclusive marks, Trinitarian Seal, including its active/"on" state) and the Clear/help icon buttons have hover-color and press feedback, matching `addButtonClass`'s recipe.

### LiturgyWebView

`components/liturgy/LiturgyWebView.tsx` is the public, responsive, nav-free read surface for both templates. It consumes the shared read-only render preparation and ignores Compile View page/column editing layout.

### Supporting controls

- `components/liturgy/CopyLinkButton.tsx` — copies the public Web View URL and exposes success feedback.
- `components/liturgy/EndNoteToggle.tsx` — controls the authored output end note.
- `components/liturgy/LiturgyDateRow.tsx` — shared liturgy date/status row, pairing a Morning + Vesper liturgy on the same service_date into one row with the Lord's Day # between them. Used by both `/liturgies` (since 2026-07-29) and the Homepage's "Recent Liturgies" preview (since 2026-08-27) — the two must stay on this one shared component/grouping helper rather than drift into separate implementations again. Gained a `readOnly?: boolean` prop (2026-08-28, default `false`) that suppresses the Delete button regardless of `currentUser` — the Homepage preview passes it since that list is purely display, not management; `/liturgies` keeps the default. **Established pattern:** any future read-only rendering of a normally-interactive shared row component should add a `readOnly` prop like this one, not a duplicated component or a `currentUser={null}` workaround at the call site.
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

Interactive states (2026-08-28, emil-design-eng Phase 4 — see `ui-rules.md`'s Motion & Animation section for tokens/timing): every Save/Cancel pair across these five forms now carries the same press-feedback recipe as `components/liturgy/`'s (this was a real Phase 2 gap — that pass only covered `components/liturgy/*.tsx` and missed this folder entirely; if a new shared-string button pattern is fixed in one folder, grep the whole repo for it, not just the folder you're in). Each row's "Edit" link gets press-only feedback (no hover-color invented, since none existed); "Delete" gets a hover-color transition only, matching the bare-icon-no-scale judgment call already made for Compile View's Pencil/Trash in Phase 2. The inline `isEditing` swap itself has no entrance transition, consistent with Compile View's own edit-form swap never getting one either.

### Shared library components

- `components/library/BilingualGrid.tsx` — paired-language presentation.
- `components/library/LibraryTextPreview.tsx` — consistent marked-text preview for library prose. Its "See more" button (2026-08-28) has press-only feedback; opening the full-text `Modal` inherits that component's own entrance animation from Phase 1 for free.
- `components/library/TranslationPairFields.tsx` — translation and companion-pair controls.

Do not duplicate bilingual pairing fields or preview rendering inside type-specific rows.

---

## Reader

### BookChapterPicker / HighlightColorPicker

- `components/reader/BookChapterPicker.tsx` uses standard form-input tokens for book/chapter navigation.
- `components/reader/HighlightColorPicker.tsx` uses semantic token swatches with a ring for the active choice. Press feedback added (2026-08-28, emil-design-eng Phase 3) — swatches are picked occasionally, not per-verse, so they get the standard press recipe unlike the Reader's high-frequency controls below.

### ReaderTargetPicker

`components/reader/ReaderTargetPicker.tsx` selects the destination Liturgy/Section without moving Section-scope authority into the client. Its mode-toggle buttons and "Set Target" button (2026-08-28, Phase 3) carry the same hover/press recipe as the rest of the app's buttons — shown once per Reader session (arriving with no target set), not a frequent control.

### VerseDisplay

`components/reader/VerseDisplay.tsx` owns the reading surface, highlights, and verse marker states. Addable/pending markers are compact square buttons; a saved marker is passive typography, not a disabled button. Text highlighting and Selection-building remain separate click targets. **Deliberately carries no motion of any kind (confirmed 2026-08-28, emil-design-eng Phase 3)** — verse markers and the highlight click are the single highest-frequency interaction in the app; do not add hover/press/transition here even when applying a recipe used everywhere else, per `ui-rules.md`'s frequency map.

When compiling, `app/reader/ReaderClient.tsx` uses the sticky composition panel beside the reading column. Plain Reader browsing remains a single reading column. Its `successMessage` panel (2026-08-28, Phase 3) gets the same fade+`translateY` entrance as Compile View's Add panels — occasional (once per successful save). **`AddSelectionPanel` here is deliberately not given an entrance transition**, unlike its Compile-View counterparts: it's keyed on the candidate citation and remounts on every verse-marker click, so an entrance animation would replay on every mark rather than once per genuine open — a trap for anyone reusing the Phase 2 Add-panel pattern here without checking why it's absent.

---

## Generic UI

### Modal

`components/ui/Modal.tsx` is the shared visual overlay. It closes through its close button, an outside click, or Escape, and uses the tokenized modal surface. Full dialog accessibility (2026-08-25): `role="dialog"`/`aria-modal`/`aria-labelledby`, initial focus on the close button, Tab/Shift+Tab focus containment within the dialog, and focus restored to whatever triggered it on close — live-verified in a browser, not just typechecked. Interactive states (2026-08-27, emil-design-eng Phase 1 — see `ui-rules.md`'s Motion & Animation section for tokens/timing): the dialog has an entrance transition, scaling in at `transform-origin: center` — the one deliberate exception to origin-aware popovers, since a modal isn't anchored to a trigger. The close button has hover and press feedback. Exit remains instant (parent unmounts on close); animating it would need a delayed-unmount refactor, deliberately out of scope for this phase.

---

## Output Components

Active Word generation lives in `lib/docx/LiturgyDocx.ts`; it is one audience-parameterized implementation for both templates. The buried PDF compatibility component lives in `lib/pdf/LiturgyDocument.tsx` and is explicit-opt-in only. Neither is a DOM UI component, but both consume the same shared content decisions recorded above.
