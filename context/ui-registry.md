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

**Sermon is a deliberate exception to this one-chokepoint pattern (2026-08-31, Track B Ticket 18).** Song and Verbal Cue already read structured fields off the resolved item rather than `resolveItemText`'s flat `text` string; Sermon follows the same precedent for its own reason — a small-caps title plus centered, four-field (Title/Series/Passage/Preacher) layout can't be carried in one plain string. Compile View (`SectionCard.tsx`'s `SermonBody`), Web View (`LiturgyWebView.tsx`'s `SermonBody`), and DOCX (`LiturgyDocx.ts`'s `sermonParagraphs`) each read `title`/`series`/`passage`/`preacher` directly off the placed item and render their own small-caps-title/centered treatment; absent fields are skipped, never rendered as an empty line. `resolveItemText`'s own `"sermon"` case still exists and remains the live path only for the frozen legacy PDF (`lib/pdf/LiturgyDocument.tsx`), which has no per-type Sermon branch. Any future item type needing structured, non-flat rendering should follow this same precedent (a dedicated per-surface component reading the raw item) rather than trying to force it through `resolveItemText`'s single string.

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

**Curator pending-item badge (2026-08-31, Track B Ticket 14):** `lib/auth/getPendingCuratorCount.ts` sums pending Account Requests and Library Submissions only (Active Accounts/Bin/Deletion Log are informational, never counted), fetched once in `TopNav.tsx` and only for a signed-in Curator. `AccountMenu.tsx` renders the same count as a badge on both the account icon and the "Curator Inbox" dropdown link, hidden entirely at zero rather than showing a "0." Badge classes follow `ui-tokens.md`'s declared Badge spec exactly — `rounded-full px-2 py-0.5 text-xs font-medium` — not a custom size; both call sites must stay on this shared spec rather than drifting to their own dimensions (a real drift that shipped and was later corrected).

### ScriptureLinker

`components/layout/ScriptureLinker.tsx` mounts the BibleGateway display-only linker once and rescans after route changes. It renders no project UI of its own and never stores AB2001/MBB text.

---

## Liturgy Composition

### SectionCard

`components/liturgy/SectionCard.tsx` is the editing-aware Compile View surface. It renders the permitted add controls from the Section whitelist, placed Item controls, header references, merged Selections, Prayer Guides, and per-Item edit/delete affordances. It uses the plain bulletin-like Section treatment rather than the generic card surface. The three explicitly eligible natural-flow Sections expose `NaturalFlowToggle`; it stores a per-liturgy Section choice and is shared with `prepareSectionRender` so Compile View, DOCX/PDF, and Web View merging cannot drift. Assurance of Pardon keeps its separate, unconditional natural-flow behavior and shows no toggle.

An empty Section renders its heading and available add controls only. Item deletion always routes through the generic remove action.

**Only one Add panel or item editor is ever open per Section (2026-08-27).** `SectionCard` holds one `openTarget` state, not one boolean per panel type — opening or editing anything replaces whatever was open, it never stacks. Switching away from a panel with unsaved input (tracked via a capture-phase input/change listener, not a prop from each child) confirms before discarding; re-clicking the open trigger to close it goes through the same dirty check. Any future panel or editor added to `SectionCard` should route its open/close through `requestOpenChange`/`closeOpenTarget`, not a new independent `useState`. **Known gap, accepted by design:** the dirty check only sees `<input>`/`<select>`/`<textarea>` changes — a plain `<button>`-driven choice inside a panel (a mode-switch button, `AddExistingSelectionPanel`'s Trinitarian Seal cycle button, a mark toggle) won't register as dirty on its own. `survey`-confirmed 2026-08-27 as an accepted tradeoff, not a defect — instrumenting every button-based choice would mean touching all ~13 Add-panel/edit-form files individually, which the capture-phase approach was chosen specifically to avoid.

Interactive states (2026-08-27, emil-design-eng Phase 2 — see `ui-rules.md`'s Motion & Animation section for tokens/timing): the shared `addButtonClass` const (every "+ X" trigger) has hover-color and press feedback — one edit covers all call sites, the reference pattern for any future shared button-class const. Pencil/Trash icon buttons have a hover-color transition only, deliberately no press-feedback scale (a bare small icon with no background reads as jitter, not feedback, at that treatment — judgment call, revisit if it looks wrong in practice). Every Add-panel/edit-form mount point gets a restrained fade-in entrance, not an instant pop.

**Section-title-plus-item-header row spacing (2026-08-28), shared with `LiturgyWebView.tsx` — same fix applied to both, not independent choices.** The `h2` Section title and its optional single-item header (a Song title, a Selection/Formula citation) sit in one `flex items-baseline justify-between gap-x-4 gap-y-1 flex-wrap` row. A single `gap-4` here originally governed both cases, which looked fine inline but read as much too far apart once the header wraps below the title — the smaller 13px header text has less visual weight to anchor against 16px of empty space than the 16px title does. Split into `gap-x-4` (unchanged, correct for the inline case) and a much tighter `gap-y-1` (the wrapped case) rather than picking one compromise value. Any future Section-title-plus-header row should use this same split, not a single `gap-4`.

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

Marks remain structured offsets separate from raw prose. Congregation and Minister are mutually exclusive speaker marks; Bold and Small Caps are independent overlays. Every marking toolbar includes Clear so the help text always names an available action; the live preview renders only once there is text to preview. Citation display uses the shared formatting/linking behavior and citation token.

Interactive states (2026-08-27, emil-design-eng Phase 2): every toolbar toggle button (Bold, Small Caps, exclusive marks, Trinitarian Seal, including its active/"on" state) and the Clear/help icon buttons have hover-color and press feedback, matching `addButtonClass`'s recipe.

### LiturgyWebView

`components/liturgy/LiturgyWebView.tsx` is the public, responsive, nav-free read surface for both templates. It consumes the shared read-only render preparation and ignores Compile View page/column editing layout.

**Section spacing rhythm (2026-08-28):** between-Sections spacing uses `gap-8` (32px, not the Compile View's `gap-6` — this surface has no card borders to reinforce the boundary, so whitespace alone has to read as a clear break next to bold all-caps headings); Section-internal spacing (title to body) uses `gap-2` (8px). See `SectionCard`'s entry above for the shared Section-title-plus-header row `gap-x-4`/`gap-y-1` split, used identically here.

### Supporting controls

- `components/liturgy/CopyLinkButton.tsx` — copies the public Web View URL and exposes success feedback.
- `components/liturgy/EndNoteToggle.tsx` — controls the authored output end note.
- `components/liturgy/LiturgyDateRow.tsx` — shared liturgy date/status row. Used by both `/liturgies` (since 2026-07-29) and the Homepage's "Recent Liturgies" preview (since 2026-08-27) — the two must stay on this one shared component/grouping helper rather than drift into separate implementations again. `readOnly?: boolean` (2026-08-28, default `false`) suppresses the whole per-liturgy options menu regardless of `currentUser` — the Homepage preview passes it since that list is purely display, not management; `/liturgies` keeps the default. **Established pattern:** any future read-only rendering of a normally-interactive shared row component should add a `readOnly` prop like this one, not a duplicated component or a `currentUser={null}` workaround at the call site. **Redesigned 2026-08-30:** at `sm` and above, the left identity is an unboxed 120px rail, not a competing card: left-aligned 16px semibold small-caps Ibarra Lord's Day #/Special Service with the 13px long-form date beneath it, vertically centered across the associated rows, and connected to them by a subtle right divider. Morning and Vesper are equal `flex-1` columns. Below `sm`, the same identity becomes a full-width inline header with a bottom divider and the non-empty Morning/Vesper groups stack at full width; an empty group is hidden only on mobile and returns as an equal-width placeholder at `sm`, preserving desktop alignment without phantom mobile gaps. Every liturgy gets its own `border border-border rounded-md px-3 py-2` container even when multiple liturgies of one type share the date; each carries a left-anchored badge above the current summary — Morning (`bg-morning`/`text-morning-foreground`) and Vesper (`bg-vesper`/`text-vesper-foreground`). Badge geometry follows `ui-rules.md` (2px/10px padding, 11px/500 weight, pill radius). Its summary resolves a Morning Sermon Title first, then falls back to its Passage; Vesper’s Discourse summary remains unchanged. Each liturgy's trailing actions live in `components/liturgy/LiturgyOptionsMenu.tsx` (Edit / conditionally rendered Mark as Ready / Web Link / Delete), and Delete opens `components/liturgy/ConfirmDeleteLiturgyDialog.tsx` rather than a native `window.confirm`.

### ConfirmDeleteLiturgyDialog
File: `components/liturgy/ConfirmDeleteLiturgyDialog.tsx`

| Property | Class/Value |
| --- | --- |
| Background | Modal `bg-surface`; unselected option `bg-surface-secondary`; selected option `bg-error-light`; destructive action `bg-error` |
| Border | Modal and secondary action `border border-border`; unselected option `border-border`; selected option `border-error` |
| Border radius | Modal `rounded-lg`; options and actions `rounded-md` |
| Text — primary | `text-text-primary` for title, occasion, and secondary action |
| Text — secondary | `text-text-secondary` for explanatory copy; `text-text-muted` for unselected options |
| Text — destructive | `text-error` on selected options; `text-error-foreground` on the destructive action |
| Spacing | Modal `p-6 gap-4`; options `px-3 py-2`; actions `px-4 py-2`; related controls use `gap-2` |
| Interactive states | Toggleable options and actions use the established press feedback; destructive action uses `disabled:opacity-50` |
| Shadow | Inherits Modal `shadow-lg` |

**Pattern notes:** Reuse `Modal.tsx` for its complete dialog and focus contract. Focused confirmations may opt into its semantic `compact` variant; content-heavy dialogs retain the default variant. Morning remains before Vesper regardless of which liturgy triggered the dialog, and combined-delete copy follows that same order. A GitHub-style gate prints the signed-in Compiler's own account name and requires an exact match; a Curator has no typed gate. For any future "delete N related things one call at a time" flow, track successful deletions individually, refresh after each success, and identify the specific item that failed so partial completion is never presented as no completion.

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

Formula, Prayer, and Song forms are hosted unchanged by the uniform `AddLibraryItemModal` for creation and reused by inline row editors; the old dedicated `/new` routes do not exist. Song’s Section field is a checkbox multi-select backed by `song_section_tags`; Prayer’s visible Title is a read-only preview derived from its Prayer Content, not a stored field. Scripture creation uses `ScriptureSelectionForm`; `ScriptureSelectionRow` implements its own inline editor. Rows own display/edit state and respect ownership/role affordances supplied by server-authorized page data.

Interactive states (2026-08-28, emil-design-eng Phase 4 — see `ui-rules.md`'s Motion & Animation section for tokens/timing): every Save/Cancel pair across these five forms now carries the same press-feedback recipe as `components/liturgy/`'s (this was a real Phase 2 gap — that pass only covered `components/liturgy/*.tsx` and missed this folder entirely; if a new shared-string button pattern is fixed in one folder, grep the whole repo for it, not just the folder you're in). Each row's "Edit" link gets press-only feedback (no hover-color invented, since none existed); "Delete" gets a hover-color transition only, matching the bare-icon-no-scale judgment call already made for Compile View's Pencil/Trash in Phase 2. The inline `isEditing` swap itself has no entrance transition, consistent with Compile View's own edit-form swap never getting one either.

### Shared library components

- `components/library/BilingualGrid.tsx` — paired-language presentation.
- `components/library/AddLibraryItemButton.tsx` / `AddLibraryItemModal.tsx` — one self-contained Library trigger and uniform Modal shell for Formula, Prayer, Song, and separately-authored Prayer Guide creation; host the existing type-specific form instead of reproducing its fields or validation. Authoring modals do not dismiss on a backdrop click.
- `components/library/ConfirmDeleteLibraryItemDialog.tsx` — the shared compact destructive confirmation for all four Library row types. Keep a failed delete’s error inside the open dialog, never behind its modal overlay.
- `components/library/AddScriptureFromReaderLink.tsx` — Library Scripture creation begins with one `+ New Scripture` link to Reader `?from=library`; the Reader owns target selection, and the return context stays available as `Back to Library`.
- `components/library/LibraryTextPreview.tsx` — consistent marked-text preview for library prose. Its "See more" button (2026-08-28) has press-only feedback; opening the full-text `Modal` inherits that component's own entrance animation from Phase 1 for free.
- `components/library/TranslationPairFields.tsx` — translation and companion-pair controls.

Do not duplicate bilingual pairing fields or preview rendering inside type-specific rows.

---

## Reader

### BookChapterPicker / HighlightColorPicker

- `components/reader/BookChapterPicker.tsx` uses standard form-input tokens for book/chapter navigation.
- `components/reader/HighlightColorPicker.tsx` uses semantic token swatches with a ring for the active choice. Press feedback added (2026-08-28, emil-design-eng Phase 3) — swatches are picked occasionally, not per-verse, so they get the standard press recipe unlike the Reader's high-frequency controls below.

### ReaderTargetPicker

`components/reader/ReaderTargetPicker.tsx` selects the destination Liturgy/Section without moving Section-scope authority into the client. A Compile arrival (`lockedTarget`, resolved server-side from `?liturgyId=&sectionIndex=`) shows the resolved Liturgy and Section as a fully locked, non-interactive target — the user genuinely cannot redirect the Selection elsewhere, not just a discouraged/greyed choice. A plain Reader arrival leaves both target modes (Liturgy Section / Scripture Library) active with no pre-selection. **A Library arrival (`?librarySection=<name>`, 2026-09-01 correction pass) pre-selects "Scripture Library" mode and that Section via `initialLibrarySection`, without locking either mode** — the user can still switch, unlike a Compile arrival. Its mode-toggle buttons and "Set Target" button (2026-08-28, Phase 3) carry the same hover/press recipe as the rest of the app's buttons — shown once per Reader session, not a frequent control.

### VerseDisplay

`components/reader/VerseDisplay.tsx` owns the reading surface, highlights, and verse marker states. Addable/pending markers are compact square buttons; a saved marker is passive typography, not a disabled button. Text highlighting and Selection-building remain separate click targets. **Deliberately carries no motion of any kind (confirmed 2026-08-28, emil-design-eng Phase 3)** — verse markers and the highlight click are the single highest-frequency interaction in the app; do not add hover/press/transition here even when applying a recipe used everywhere else, per `ui-rules.md`'s frequency map.

When compiling, `app/reader/ReaderClient.tsx` uses the sticky composition panel beside the reading column. Plain Reader browsing remains a single reading column. Its `successMessage` panel (2026-08-28, Phase 3) gets the same fade+`translateY` entrance as Compile View's Add panels — occasional (once per successful save). **`AddSelectionPanel` here is deliberately not given an entrance transition**, unlike its Compile-View counterparts: it's keyed on the candidate citation and remounts on every verse-marker click, so an entrance animation would replay on every mark rather than once per genuine open — a trap for anyone reusing the Phase 2 Add-panel pattern here without checking why it's absent.

---

## Generic UI

### Modal

`components/ui/Modal.tsx` is the shared visual overlay. It supports a default presentation for content-heavy uses and an opt-in `size="compact"` variant for focused confirmations; content complexity may vary the size without forking the shared dialog shell or behavior. It closes through its close button, an outside click, or Escape, and uses the tokenized modal surface. Full dialog accessibility (2026-08-25): `role="dialog"`/`aria-modal`/`aria-labelledby`, initial focus on the close button, Tab/Shift+Tab focus containment within the dialog, and focus restored to whatever triggered it on close — live-verified in a browser, not just typechecked. Interactive states (2026-08-27, emil-design-eng Phase 1 — see `ui-rules.md`'s Motion & Animation section for tokens/timing): the dialog has an entrance transition, scaling in at `transform-origin: center` — the one deliberate exception to origin-aware popovers, since a modal isn't anchored to a trigger. The close button has hover and press feedback. Exit remains instant (parent unmounts on close); animating it would need a delayed-unmount refactor, deliberately out of scope for this phase.

---

## Output Components

Active Word generation lives in `lib/docx/LiturgyDocx.ts`; it is one audience-parameterized implementation for both templates. The buried PDF compatibility component lives in `lib/pdf/LiturgyDocument.tsx` and is explicit-opt-in only. Neither is a DOM UI component, but both consume the same shared content decisions recorded above.
