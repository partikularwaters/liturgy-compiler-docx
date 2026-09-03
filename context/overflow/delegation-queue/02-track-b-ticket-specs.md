# Delegation Queue Archive — Track B Full Ticket Specs (Tickets 10-26)

Archived from `context/delegation-queue.md`'s "Full ticket specs (Track B)"
section on 2026-09-02 — all seventeen tickets are fully built,
`survey`-verified, and committed (see `context/progress-tracker.md`'s
Completed section and 2026-08-31/2026-09-01 Session Notes for outcomes and
verification evidence). The live queue keeps only the compact status
checklist and Execution Sequence table; this file is the original per-ticket
spec text (pattern to match, files to touch/not touch, done-when criteria),
read on demand if a future session needs to know exactly what was asked for,
not loaded by default.

---

## Full ticket specs (Track B)

### Ticket 10: Nav pill scroll-fold threshold fix

**Tier:** Junior-safe
**Required capability:** Junior-safe or higher; a stronger model may execute this ticket
**Depends on:** none
**Pattern to match:** the existing hide-on-scroll effect in `components/layout/TopNavLinks.tsx` (lines ~26-44) — fix in place, don't replace the mechanism.
**Files to touch:** `components/layout/TopNavLinks.tsx`
**Files to NOT touch:** any other layout/nav component.
**Spec:**
The current effect resets `lastScrollY.current = currentScrollY` on every single scroll event, then compares only that one event's delta against an 8px threshold. During a slow, continuous scroll, each individual event's delta is well under 8px, so `isHidden` never flips to `true` even though the page has scrolled far enough overall that the pill should have folded — it ends up overlapping page content/buttons near the bottom of a short page. Fix: only update `lastScrollY.current` when the scroll direction actually reverses or a fold/reveal decision is made — i.e. accumulate movement in the current direction until it crosses the 8px threshold, rather than measuring only the most recent event. Keep the existing `currentScrollY < 80` near-top override, the `passive: true` listener, and the same `isHidden` state shape — this is a threshold-accumulation fix, not a rewrite of the hide/reveal mechanism.
**Done when:**
- A simulated slow scroll (many small `scroll` events, each under 8px of movement, summing to well over 8px in one direction) flips `isHidden` correctly, verified either by a new test (if this component has or can reasonably get a lightweight test) or by manual verification in a real browser: open a page long enough to scroll, perform a slow continuous scroll-down (small, steady mouse-wheel increments, not a fast flick), confirm the pill folds before reaching the bottom.
- The existing fast-scroll and near-top behaviors are unchanged (verify by the same manual check: a fast scroll still folds immediately; scrolling back near the top still reveals it).
- `tsc --noEmit`, `eslint`, `next build` clean.
**Do not:**
- Do not change the 8px threshold value itself unless accumulation alone doesn't fix the bug — if you find you need to change it, state why in your completion report.
- Do not touch the `currentScrollY < 80` near-top branch's behavior.

---

### Ticket 11: Formula preview renders marks

**Tier:** Junior-safe
**Required capability:** Junior-safe or higher; a stronger model may execute this ticket
**Depends on:** none
**Pattern to match:** `components/liturgy/MarkEditor.tsx`'s own preview (`<MarkedText text={preview.text} marks={preview.marks} />`) — same `MarkedText` component, same call shape.
**Files to touch:** `components/liturgy/AddFormulaPanel.tsx`
**Files to NOT touch:** `MarkEditor.tsx`, `FormulaEditForm.tsx`, `MarkedText.tsx` itself.
**Spec:**
`AddFormulaPanel.tsx` (around line 93-94) renders the selected Formula's live preview as raw text: `<p ...>{selectedFormula.defaultText}</p>`, completely ignoring `selectedFormula.marks` — so a Formula with Congregation/Minister/Small-Caps/Bold marks already set at the library level shows as plain unmarked prose in this picker, even though placing it actually copies those marks onto the new instance (per `architecture.md`'s `formulas.marks` schema note). Replace the raw `<p>{selectedFormula.defaultText}</p>` with `MarkedText` rendering `selectedFormula.defaultText` with `selectedFormula.marks` (import `MarkedText` from wherever `MarkEditor.tsx` imports it from). Keep the same surrounding `<p>`/wrapper classes for typography — only the text-rendering mechanism changes, not the layout.
**Done when:**
- Selecting a library Formula that has Congregation/Minister/Small-Caps/Bold marks set shows those marks rendered (indent+label, small caps, bold) in the Add-Formula panel's preview, matching how the same Formula's marks render once actually placed in a Section.
- A Formula with no marks still renders identically to before (plain prose, no regression).
- `tsc --noEmit`, `eslint`, `next build` clean; manually verified in a real browser against a real Formula with at least one mark type set.
**Do not:**
- Do not add any new editing capability to this panel — it's a preview only, not an edit surface.
- Do not change `FormulaEditForm.tsx` or `MarkEditor.tsx` — they already render marks correctly.

---

### Ticket 12: Library delete flows adopt the liturgy-delete dialog pattern

**Tier:** Junior-safe
**Required capability:** Junior-safe or higher; a stronger model may execute this ticket
**Depends on:** none
**Pattern to match:** `components/liturgy/ConfirmDeleteLiturgyDialog.tsx` — reuse its shape (a `Modal`-based confirm dialog with a clear consequence statement) minus its typed-name confirmation gate entirely (no `typedName` state, no text input, no "type your name" copy) — just a clear message and a Delete/Cancel button pair.
**Files to touch:** `components/formulas/FormulaListRow.tsx`, `components/prayers/PrayerListRow.tsx`, `components/songs/SongListRow.tsx`, and the Scripture Selection row / "See more" modal's delete affordance (locate the equivalent row/modal component under `components/library/` or wherever Scripture Selections render in `/library` — mirror the same fix there). New shared component: `components/library/ConfirmDeleteLibraryItemDialog.tsx` (one shared dialog, parameterized by item label and delete handler, reused across all four list rows and the "See more" modal — do not write four near-duplicate dialogs).
**Files to NOT touch:** `ConfirmDeleteLiturgyDialog.tsx` itself, `deleteFormula`/`deletePrayer`/`deleteSong`/the Scripture Selection delete action (call them exactly as `window.confirm`'s callback already does today — only the confirmation UI changes, not the delete logic or its existing consequence-message text, e.g. "This does not remove it from liturgies it's already placed in.").
**Spec:**
Each of `FormulaListRow.tsx`, `PrayerListRow.tsx`, `SongListRow.tsx` currently gates its delete action behind a native `window.confirm(...)` call (see each file's `handleDelete`-equivalent, e.g. `FormulaListRow.tsx:64`). Replace each with the new shared `ConfirmDeleteLibraryItemDialog` — same trigger point (the existing delete button/icon), same existing consequence copy per item type, same existing delete action call on confirm — just a designed `Modal`-based dialog instead of the browser-native confirm. Apply the identical fix to the Library "See more" modal's own delete affordance (find it, likely in a component rendering an expanded/detail view of a Scripture Selection or similar).
**Done when:**
- All four item types (Formula, Prayer, Song, Scripture Selection) and the "See more" modal use the new shared dialog component, not `window.confirm`.
- No `window.confirm` calls remain in any of the touched files.
- Each dialog shows the same consequence message the corresponding item type already had; clicking Delete still calls the same existing delete action; clicking Cancel closes the dialog with no delete call.
- `tsc --noEmit`, `eslint`, `next build` clean; manually verified in a real browser: delete flow works end-to-end for at least two of the four item types (confirm cancels correctly, confirm deletes correctly, list updates after deletion).
**Do not:**
- Do not add a typed-name confirmation gate — explicitly excluded from this pattern per the confirmed plan.
- Do not change any delete action's server-side logic or authorization.

---

### Ticket 13: Section-Translation/content contrast pass

**Tier:** Junior-safe
**Required capability:** Junior-safe or higher; a stronger model may execute this ticket
**Depends on:** none
**Pattern to match:** `ui-tokens.md`'s existing text-color token scale (`text-primary`/`text-secondary`/`text-muted`) — this is a token-weight adjustment, not a new color.
**Files to touch:** locate the Section-Translation/language label rendering (likely in `SectionCard.tsx` or a small dedicated label component near where Selection `translation`/language is shown) and its surrounding item-content text.
**Files to NOT touch:** `ui-tokens.md` itself, unless the fix genuinely requires a new token value — if so, add it there following the file's existing structure and state why in your completion report, rather than hardcoding a one-off value in the component.
**Spec:**
The Section-Translation/language label currently reads as too close in visual weight to the item content beneath it, per direct observation. Locate the exact label (search for where a Selection's `translation`/language indicator renders inside `SectionCard.tsx`), and increase the visual separation using existing tokens — e.g. shifting the label to a more muted token (if it's currently too close to `text-primary`) or the content to a firmer one, whichever direction actually produces clearer separation without contradicting `ui-rules.md`'s existing typography rules for that region. Use only tokens already defined in `ui-tokens.md`; do not introduce a hardcoded hex or raw Tailwind color class (`architecture.md`'s Invariants forbid this).
**Done when:**
- A real Section with both a language/translation label and item content shows a visibly clearer distinction between the two, confirmed via a real-browser screenshot comparison (before/after) rather than just a code diff.
- `tsc --noEmit`, `eslint`, `next build` clean.
**Do not:**
- Do not use a hardcoded hex value or raw Tailwind color class.
- Do not change any other Section-rendering visual property (spacing, font) beyond the specific contrast fix.

**Correction, 2026-09-01:** a same-session survey initially flagged this as unresolved, since no Section-Translation label exists in `SectionCard.tsx` (the ticket's own hedge — "likely `SectionCard.tsx`" — turned out wrong) and the fix instead landed in the four Library list rows (`FormulaListRow.tsx`/`PrayerListRow.tsx`/`SongListRow.tsx`/`ScriptureSelectionRow.tsx`), bundled into the same diff as Ticket 12. On closer check against `ui-tokens.md`'s own declared Typography scale (`13px / weight 500 / text-secondary` for "Label"), the shipped `text-[13px] font-medium text-text-secondary` is the exact, correct implementation of that token, not a drift-in-the-wrong-direction as first assessed — the earlier verdict is withdrawn. Genuine, non-blocking cleanup still worth doing later: split this change into its own commit/diff rather than leaving it silently bundled with Ticket 12's dialog work.

---

### Ticket 14: Notification badges on nav account icon and Curator Inbox entry

**Tier:** Junior-safe
**Required capability:** Junior-safe or higher; a stronger model may execute this ticket
**Depends on:** none
**Pattern to match:** `components/layout/AccountMenu.tsx` for where to mount the badge on the account icon; `app/curator-inbox/page.tsx`'s existing tabs (`AccountRequestsTab`, `LibrarySubmissionsTab`, `ActiveAccountsTab`, `BinTab`, `DeletionLogTab`) for what counts as a pending/actionable item worth badging.
**Files to touch:** `components/layout/AccountMenu.tsx`, a small new server-side count helper (e.g. `lib/auth/getPendingCuratorCount.ts` or similar, following the existing `lib/auth/` module shape), and whichever layout component passes `currentUser`/counts down to `AccountMenu`.
**Files to NOT touch:** `app/curator-inbox/page.tsx`'s tab content itself — this ticket only adds a count badge to the nav entry point, not new UI inside the Inbox.
**Spec:**
Add a small numeric badge (following whatever existing badge/pill visual convention this codebase uses — check `ui-tokens.md`/`ui-rules.md` for an existing badge spec before inventing one; if none exists, use a small circular count matching the existing `bg-morning`/`bg-vesper` pill sizing conventions in `LiturgyDateRow.tsx` as the closest precedent) to: (a) the nav's account icon itself, showing a combined count of anything requiring the current user's attention (define this as the sum of pending items across the Curator Inbox tabs that represent an actionable queue — Account Requests + Library Submissions are the clear candidates; Active Accounts/Bin/Deletion Log are informational, not actionable, and should not count), and (b) the "Curator Inbox" link inside the account dropdown specifically, showing the same count. Badge is visible only to a Curator (the only role with `/curator-inbox` access, per the existing `contextHref` logic in `AccountMenu.tsx`) and only rendered when the count is greater than zero (hidden entirely at zero, not a "0" badge).
**Done when:**
- A signed-in Curator with at least one pending Account Request or Library Submission sees a non-zero badge on both the account icon and the Curator Inbox link; a Curator with zero pending items sees no badge in either place.
- A Compiler (non-Curator) or anonymous visitor never sees this badge anywhere, regardless of underlying pending-item counts.
- `tsc --noEmit`, `eslint`, `next build` clean; manually verified in a real browser against real pending data (or seeded local data) for a Curator account.
**Do not:**
- Do not badge Active Accounts, Bin, or Deletion Log counts — those are informational tabs, not actionable queues.
- Do not add badging to any other nav element beyond the two named above.

**Correction, 2026-09-01:** a same-session survey found both badges used custom hand-rolled dimensions (`min-w-[16px] h-4 px-1 text-[10px]` on the account icon, `min-w-[18px] h-[18px] px-1.5 text-[11px]` on the Curator Inbox link — neither matching the other) instead of `ui-tokens.md`'s declared Badge spec (`rounded-full px-2 py-0.5 text-xs font-medium`). Fixed both to the declared token classes exactly, in `components/layout/AccountMenu.tsx`.

---

### Ticket 15: Words of Thanksgiving — add Selection Congregation marking

**Tier:** Junior-safe
**Required capability:** Junior-safe or higher; a stronger model may execute this ticket
**Depends on:** none
**Pattern to match:** the existing `DIALOGUE_MARK_SECTIONS` array in `lib/liturgy/markableSections.ts:8`.
**Files to touch:** `lib/liturgy/markableSections.ts`
**Files to NOT touch:** `FORMULA_MARK_SECTIONS` or `getFormulaMarks` in the same file — this ticket is Selection-marks only (`getSelectionMarks`/`DIALOGUE_MARK_SECTIONS`), not Formula. (Formula's Words of Thanksgiving change is separately handled in Ticket 23.)
**Spec:**
Add `"Words of Thanksgiving"` to the `DIALOGUE_MARK_SECTIONS` array (currently `["Call to Worship", "Prayer of Invocation"]`). This gives any Selection placed in that Section the Congregation marking tool alongside the Small Caps it already has, via the existing `getSelectionMarks()` function — no other code change needed, since every caller already reads from this array.
**Done when:**
- `getSelectionMarks("Words of Thanksgiving")` returns `["congregation", "small_caps"]`.
- A Selection placed in the real Words of Thanksgiving Section (Vesper) shows the Congregation marking button in its edit-time toolbar, verified in a real browser against a real Vesper liturgy.
- `npm test`, `tsc --noEmit`, `eslint` clean.
**Do not:**
- Do not modify `FORMULA_MARK_SECTIONS`/`getFormulaMarks` in this ticket.

---

### Ticket 16: Wire `TranslationPairFields` into Compile-View inline-create

**Tier:** Junior-safe
**Required capability:** Junior-safe or higher; a stronger model may execute this ticket
**Depends on:** none
**Pattern to match:** `components/songs/SongForm.tsx`'s existing `TranslationPairFields` usage (lines ~155-163) — same component, same `translation`/`pairedId` state shape, same `onTranslationChange`/`onPairedIdChange` wiring, same submit-call shape passing both values through.
**Files to touch:** `components/liturgy/AddSongPanel.tsx`, `components/liturgy/AddPrayerPanel.tsx`
**Files to NOT touch:** `components/songs/SongForm.tsx`, `components/prayers/PrayerForm.tsx`, `lib/songs/songActions.ts`, `lib/prayers/prayerActions.ts` (the `createSong`/`createPrayer` functions already accept `translation`/`pairedId` as optional trailing parameters — no signature change needed, just pass real values instead of omitting them).
**Spec:**
`AddSongPanel.tsx`'s inline "create new" mode calls `createSong(sectionName, kind, title, attribution, yearPublished, notes)` — six arguments, omitting `translation`/`pairedId` entirely, so they silently default to `null`. `AddPrayerPanel.tsx`'s inline "create new" mode calls `createPrayer(sectionName, text)` — same gap. Add `TranslationPairFields` to each panel's "new" mode UI (following `SongForm.tsx`'s exact usage as the template), with local `translation`/`pairedId` state, and pass both through to the `createSong`/`createPrayer` call. For the pairing-candidate list each `TranslationPairFields` needs (the opposite-translation same-Section/kind list), reuse the same filtering logic `SongForm.tsx`/`PrayerForm.tsx` already use (`.filter((s) => s.id !== id && s.sectionName === sectionName && s.translation === opposite)`, adjusted for Song's additional `kind` filter) — the panels already receive the full `songs`/`prayers` list as props, so no new data-fetching is needed.
**Done when:**
- Creating a new Song or Prayer inline from Compile View shows the same translation/pair picker `SongForm.tsx`/`PrayerForm.tsx` already show, and the created row is saved with the chosen `translation`/`pairedId` instead of always `null`.
- Existing "pick an existing item" mode in both panels is unaffected (this ticket touches "create new" mode only).
- `tsc --noEmit`, `eslint`, `next build` clean; manually verified in a real browser: create a new Song inline from Compile View with a translation tag set, confirm it's saved with that tag (check via `/library` or a direct query).
**Do not:**
- Do not change `createSong`/`createPrayer`'s function signatures.
- Do not touch the "pick existing" mode's logic in either panel.

---

### Ticket 17: `MarkEditor` help text conditional on available marks

**Tier:** Junior-safe
**Required capability:** Junior-safe or higher; a stronger model may execute this ticket
**Depends on:** none
**Pattern to match:** `MarkEditor.tsx`'s existing conditional rendering of `allowTrinitarianSeal`'s extra sentence (line 201) — same "append a conditional sentence" shape, applied to the Leader/label sentence instead.
**Files to touch:** `components/liturgy/MarkEditor.tsx`
**Files to NOT touch:** any caller of `MarkEditor` — this is a self-contained internal fix, `availableMarks` is already a prop this component receives.
**Spec:**
The help text at `MarkEditor.tsx:198-201` unconditionally includes "Select a range of text above, then click a label — unmarked text stays Leader (flush left, no label)." This sentence only makes sense when the Leader/Congregation/Minister dialogue system applies — i.e. when `availableMarks` includes `"congregation"` or `"minister"`. When `availableMarks` is only `["small_caps"]`, `["bold"]`, or similar (no dialogue marks offered), replace that sentence with a simpler one describing only what's actually available, e.g. "Select a range of text above, then click a mark to apply it. Marks stick through further edits; use Clear to remove one." Keep the "Marks stick through further edits; use Clear to remove one." sentence in both cases (it's universally true, not label-system-specific) and keep the existing Trinitarian Seal conditional sentence unchanged.
**Done when:**
- Opening the help text on a Section with Congregation/Minister marks available still shows the current, unchanged wording.
- Opening the help text on a Section with only Small Caps and/or Bold available shows the new, label-free wording instead.
- `npm test`, `tsc --noEmit`, `eslint` clean; manually verified in a real browser against one Section of each kind (e.g. Assurance of Pardon for the dialogue case, a plain Selection Section for the non-dialogue case).
**Do not:**
- Do not change the Trinitarian Seal sentence's own condition or wording.
- Do not change any non-text behavior of `MarkEditor`.

---

### Ticket 18: Sermon — four fields, data model through every render surface

**Tier:** Junior-safe
**Required capability:** Junior-safe or higher; a stronger model may execute this ticket
**Depends on:** none
**Pattern to match:** `SongItem`'s snapshot-field shape in `types/liturgy.ts` (optional fields, no migration needed since `section_items.data` is jsonb) for the type extension; `resolveItemText.ts`'s existing `case "sermon":` (currently `return { label: "Sermon", text: item.passage, leaderOnly: false, rubric: false };`) as the one chokepoint every renderer (docx both audiences, legacy PDF, Web View, Compile View) already consumes — per `architecture.md`'s Invariant, changing this one function's Sermon case is what makes the new fields appear everywhere, without touching each renderer individually. `SermonForm.tsx`/`sermonActions.ts`'s existing single-field shape as the direct pattern to extend to four fields.
**Files to touch:** `types/liturgy.ts` (`SermonItem`), `components/liturgy/SermonForm.tsx`, `lib/liturgy/sermonActions.ts` (`saveSermonPassage`), `lib/liturgy/resolveItemText.ts` (the `"sermon"` case).
**Files to NOT touch:** `LiturgyDateRow.tsx` (that's Ticket 19), any docx/PDF/Web-View renderer file directly (they consume `resolveItemText`'s output already — no direct edit needed if the chokepoint is correct; if you find a renderer bypasses `resolveItemText` for Sermon specifically, stop and report rather than guessing why).
**Spec:**
Extend `SermonItem` (`types/liturgy.ts:222-226`) with three new optional fields alongside the existing `passage: string`: `title?: string`, `series?: string`, `preacher?: string`. Do not rename or duplicate `passage` — it remains the one "Sermon Text" field, per the confirmed decision not to invent a second field for the same concept.
Extend `SermonForm.tsx` with four inputs (Title, Series, Passage, Preacher — reordering the existing Passage field alongside the three new ones, all following the same labeled-input pattern the existing Passage field already uses) and extend its `onSubmit` callback signature to pass all four values.
Extend `saveSermonPassage` in `sermonActions.ts` to accept and persist all four fields on the `SermonItem` row (same `section_items.data` jsonb write it already does for `passage`, just with three more keys).
Update `resolveItemText.ts`'s `"sermon"` case to build a combined text block including whichever of Title/Series/Preacher are present, in a sensible reading order (Title as a heading-like lead, Series and Preacher as secondary lines, Passage/Sermon Text as the reference) — since `ResolvedItem.text` is the one string every renderer displays, structure it clearly (e.g. line breaks between Title, Series, Passage, Preacher) rather than concatenating them into one run-on line. All four fields remain public (`leaderOnly: false`, unchanged from today).
**Done when:**
- `SermonItem` has all four fields; old Sermon records with only `passage` (no `title`/`series`/`preacher`) continue to work with those three fields simply absent/undefined — no migration, no backfill needed (matches this codebase's existing optional-snapshot-field compatibility pattern).
- `SermonForm` shows and saves all four fields.
- **Superseded 2026-09-01, confirmed:** the original criterion below ("submitting with only Passage filled still saves successfully") was revised — Title and Preacher are now required alongside Passage (Series stays optional), validated both client-side (`SermonForm.tsx`) and server-side (`sermonActions.ts`'s `saveSermon`). ~~submitting with only Passage filled (Title/Series/Preacher blank) still saves successfully, matching today's minimum-viable behavior~~
- The Compile View, both docx export audiences, and the Web View all show whichever of the four fields are actually present for a given Sermon, verified by generating a real docx export and viewing a real Web View for a liturgy with all four fields filled, and separately for one with only Passage filled (old-style, pre-dating the required-field change).
- `npm test`, `tsc --noEmit`, `eslint`, `next build` all clean.
**Do not:**
- Do not touch `LiturgyDateRow.tsx` or the liturgy row summary line — that's Ticket 19.
- Do not make any of the four fields `leaderOnly: true` — all four are public per the confirmed decision.
- Do not rename `passage` or add a second, separate "Sermon Text" field.
- **Note (2026-09-01):** the ticket's original chokepoint plan (route every render surface through `resolveItemText`'s extended `"sermon"` case) was also superseded — Compile View, Web View, and DOCX each grew a dedicated Sermon component (`SermonBody`/`sermonParagraphs`) reading the raw item directly, since the required small-caps-title/centered presentation can't be carried in `resolved.text`'s flat string. This matches Song's and Verbal Cue's existing precedent of bypassing `resolved.text` for structured display; `resolveItemText`'s sermon case remains the live path only for the frozen legacy PDF (`lib/pdf/LiturgyDocument.tsx`), which renders `resolved.text` generically with no per-type branch. See `resolveItemText.ts`'s own comment on the `"sermon"` case.

---

### Ticket 19: Sermon — liturgy row summary Title→Passage fallback

**Tier:** Junior-safe
**Required capability:** Junior-safe or higher; a stronger model may execute this ticket
**Depends on:** Ticket 18 (`SermonItem.title` must exist first).
**Pattern to match:** `LiturgyDateRow.tsx:96`'s existing `[liturgy.sermonPassage, formatDateDisplay(liturgy.serviceDate)].filter(Boolean).join(" | ")` and `lib/liturgy/getLiturgies.ts`'s existing `sermonPassage` resolution logic (the Morning "Sermon" / Vesper "The Lord's Discourses" branch).
**Files to touch:** `lib/liturgy/getLiturgies.ts` (or wherever `LiturgySummary.sermonPassage` is populated — trace `sermonPassage`'s source before editing), `components/liturgy/LiturgyDateRow.tsx`, `types/liturgy.ts` (`LiturgySummary`, if a new field is needed — see below).
**Files to NOT touch:** `formatLiturgyName.ts` — that function's own Sermon-segment logic (`if (summary.sermonPassage)`) is a separate consumer (the page `<h1>` naming convention) not named in the confirmed plan; leave it using `sermonPassage` exactly as it does today unless you determine it must change to stay consistent — if so, stop and report rather than silently changing a second consumer beyond what was asked.
**Spec:**
`getLiturgies.ts` currently resolves one `sermonPassage` string per liturgy (Morning: the Sermon Section's `SermonItem.passage`; Vesper: The Lord's Discourses citation). Extend this so Morning liturgies also expose the new `SermonItem.title` (from Ticket 18) alongside `passage` — either by adding a new `sermonTitle: string | null` field to `LiturgySummary`, or by changing what `sermonPassage` itself resolves to (your call — but state which you chose and why in your completion report, since `formatLiturgyName.ts` also consumes this field and must not silently break). Update `LiturgyDateRow.tsx:96`'s row text to use Title if present, falling back to Passage if Title is empty/absent (today's exact value), exactly matching the confirmed fallback chain — Vesper liturgies are unaffected (they have no Title field at all, so they keep using the Discourses citation exactly as today).
**Done when:**
- A Morning liturgy with a Sermon Title set shows that Title in the `/liturgies` row text line.
- A Morning liturgy with no Title but a Passage set shows the Passage (today's exact behavior, unchanged).
- A Morning liturgy with neither set shows just the date (today's exact behavior for a fully-empty Sermon, unchanged).
- Vesper liturgies show The Lord's Discourses citation exactly as before, with zero behavior change.
- `formatLiturgyName.ts`'s own Sermon-segment behavior (the page `<h1>`) is verified unchanged (or, if you determined it needed updating, your reasoning is stated in your completion report).
- `npm test`, `tsc --noEmit`, `eslint`, `next build` clean; manually verified in a real browser against `/liturgies` for at least one Morning liturgy with a Title and one without.
**Do not:**
- Do not change Vesper's row-summary logic at all.
- Do not silently change `formatLiturgyName.ts`'s behavior without stating so explicitly.

---

### Ticket 20: Natural-flow per-instance toggle

**Tier:** Junior-safe
**Required capability:** Junior-safe or higher; a stronger model may execute this ticket
**Depends on:** none
**Pattern to match:** `sections.column_break_before`/`sections.show_prayer_guide` and `sections.silent_confession_language` — each a boolean/enum column on the `sections` instance row, defaulted, set via a small dedicated Server Action (`setColumnBreakAction.ts`/`setShowPrayerGuideAction.ts`/`setSilentConfessionLanguageAction.ts`), toggled via a small dedicated UI control in `SectionCard.tsx` (e.g. `SilentConfessionLanguageToggle.tsx` as the closest UI-component precedent). Follow this exact three-part shape (migration column, Server Action, UI control) rather than inventing a new one.
**Files to touch:** one new migration (`supabase/migrations/<timestamp>_natural_flow_toggle.sql`), a new `lib/liturgy/setNaturalFlowAction.ts` (or similar name matching the existing `set*Action.ts` convention), `components/liturgy/SectionCard.tsx` (both the new toggle UI and gating the existing merge logic at lines ~601-627).
**Files to NOT touch:** any Formula/Prayer/Song file — this ticket is Selection-merge-only.
**Spec:**
Add a new boolean column to `sections` (e.g. `merge_selections`, default `false`) via a migration following the exact shape of `20260721030000_column_break_before.sql` (simple `alter table sections add column ...` with a short rationale comment). Write a `setNaturalFlowAction.ts` mirroring `setShowPrayerGuideAction.ts`'s exact shape (auth-gated Server Action, single-column update, `revalidatePath` if that's the established convention there). Add a small toggle UI to `SectionCard.tsx`, rendered **only** when the Section's name is one of "Righteousness of God", "Call to Confession", or "The Lord's Discourses" (a small local array constant in `SectionCard.tsx` or a new export in `markableSections.ts` — your call, matching whichever existing precedent, `DIALOGUE_MARK_SECTIONS`-style or inline, reads more consistently with the surrounding code). Gate the existing merge logic (`shouldMergeSelections` at line 612) so that for these three named Sections, merging only happens when the new toggle is `true` for that Section instance; for every other Section — Assurance of Pardon included — leave the existing unconditional `selectionItems.length > 1` behavior completely untouched.
**Done when:**
- The new column exists, migrates cleanly (`npm run db:reset` replays clean), defaults to `false`.
- The toggle UI appears only on the three named Sections, nowhere else.
- Toggling it on/off for one of the three named Sections actually changes whether 2+ Selections in that Section merge into one flowing paragraph, verified live in a real browser against a real liturgy.
- Assurance of Pardon (and every Section not in the three named ones) continues to merge unconditionally whenever it has 2+ Selections, with zero behavior change and no toggle UI shown.
- `npm test`, `tsc --noEmit`, `eslint`, `next build` clean.
**Do not:**
- Do not add the toggle to Assurance of Pardon or any Section beyond the three named ones.
- Do not change Assurance of Pardon's existing hardcoded merge behavior in any way.

---

### Ticket 21: Set Target unification — `ReaderTargetPicker` always-renders, greyed inactive mode

**Tier:** Junior-safe
**Required capability:** Junior-safe or higher; a stronger model may execute this ticket
**Depends on:** none
**Pattern to match:** `ReaderTargetPicker.tsx`'s existing mode-toggle buttons (lines ~72-97) for the greyed/disabled visual treatment — a disabled button in this codebase's existing convention (check `disabled:opacity-50`, already used elsewhere in this same file's "Set Target" buttons, as the disabled-state pattern to reuse).
**Files to touch:** `app/reader/page.tsx` (wherever it currently decides whether to render `ReaderTargetPicker` at all based on whether a target is already set — locate this condition and remove it so the picker always renders), `components/reader/ReaderTargetPicker.tsx`.
**Files to NOT touch:** `app/reader/ReaderClient.tsx`'s actual target-driven behavior (verse markers, Add panel, etc.) — this ticket only changes when/how the picker itself renders, not what happens once a target is set.
**Spec:**
Today, `ReaderTargetPicker` is only rendered by its parent when the Reader has no target yet (arriving via a plain `/reader` visit); a redirect arrival (`?liturgyId=&sectionIndex=` from Compile View) skips rendering it entirely. Change this so `ReaderTargetPicker` always renders, in every arrival case. Add a new prop reflecting how the page was arrived at (e.g. `arrivedVia: "none" | "section" | "library"`, derived from which URL params are present) so the component knows which mode to show as active-but-greyed vs. fully interactive:
- Arrived via `?liturgyId=&sectionIndex=` (Compile redirect): "Liturgy Section" mode shows active and still fully usable (can switch to a different Liturgy/Section, same as today's picker-when-no-target behavior) — "Scripture Library" mode's toggle button is present but disabled (`disabled:opacity-50` or equivalent), not clickable.
- Arrived via `?librarySection=` (the new Library deep-link, built in Ticket 22): the reverse — "Scripture Library" active/usable, "Liturgy Section" toggle disabled.
- Arrived with no target at all (plain `/reader` visit): both modes fully active, exactly as today.
Preserve every other piece of the picker's existing behavior (the `showModeToggle` visibility rule, the "Set Target" button logic, the empty-state `return null` when there's truly nothing to pick from) untouched.
**Done when:**
- Arriving via Compile View's "+ Scripture" link shows the picker (not hidden), with Liturgy Section pre-set-and-switchable and Scripture Library visibly disabled.
- Arriving via a plain `/reader` visit shows both modes fully active, unchanged from today.
- `tsc --noEmit`, `eslint`, `next build` clean; manually verified in a real browser for both arrival cases described above (the `?librarySection=` case can be verified once Ticket 22 lands its deep-link, or by manually constructing that URL in this ticket's own verification).
**Do not:**
- Do not change what happens once "Set Target" is actually clicked — only the picker's own visibility/disabled-state logic changes.
- Do not remove the existing empty-state `return null` behavior.

**Superseded 2026-09-01, confirmed — read before touching this ticket's files again:** the `arrivedVia: "none" | "section" | "library"` prop described above was never built; the correction pass instead added a stricter `lockedTarget` prop to `ReaderTargetPicker.tsx`, computed only from a Compile-View arrival (`targetSection`), which renders a fully locked, non-interactive block rather than this ticket's "active but switchable, sibling mode greyed out" shape — a deliberate strengthening (the user genuinely cannot redirect a Compile-arrived Selection at all, not just "discouraged by a disabled toggle"). A `?librarySection=` arrival was left with no special treatment at all until a 2026-09-01 survey caught it: it fell through to the fully-open dual-mode picker, defaulting to "Liturgy Section" active with no indication the URL's Library choice was honored. Fixed same day with a lighter mechanism than this ticket originally specified: a new `initialLibrarySection` prop pre-selects "Scripture Library" mode and that Section, without locking it (the user can still switch, consistent with `architecture.md`'s "Reader retains its own normal picker" invariant for Library arrivals — only Compile-View arrivals get the hard lock). `app/reader/page.tsx` still does not unconditionally fetch `liturgies`/`librarySectionNames` for every arrival — it skips them only for a locked (`targetSection`) arrival, since `lockedTarget` never needs them; a `librarySection` arrival always fetches both, so this fix works without needing the ticket's original "always fetch" change.

---

### Ticket 22: `/library` "+ Add from Reader" deep-link; retire `/selections/new`

**Tier:** Junior-safe
**Required capability:** Junior-safe or higher; a stronger model may execute this ticket
**Depends on:** Ticket 21 (the greyed-picker behavior this deep-link relies on must exist first).
**Pattern to match:** `components/liturgy/SectionCard.tsx:839`'s existing `<Link href={\`/reader?liturgyId=${liturgyId}&sectionIndex=${sectionIndex}\`}>` deep-link — same shape, targeting `?librarySection=` instead.
**Files to touch:** `/library`'s Scripture Selections tab (wherever its current "+ Add Selection" link to `/selections/new` lives), `app/selections/new/` (delete this route entirely), any nav/link elsewhere pointing at `/selections/new`.
**Files to NOT touch:** `ReaderTargetPicker.tsx`'s internal mode logic (already built in Ticket 21) — this ticket only adds the new entry-point link and removes the old route.
**Spec:**
Add a new link/button on `/library`'s Scripture Selections tab, alongside (replacing) whatever currently links to `/selections/new`: `/reader?librarySection=<name>` for each real Library Section tag (mirror however the existing Compile-View deep-link is parameterized — likely one link per Section tag the way Formula/Prayer/Song "+ New" already scope by Section, or a single control with a Section picker if that's a better fit for this page's existing layout; use your judgment on the exact UI shape, but the destination URL pattern is fixed). Delete `app/selections/new/` entirely (route, its client component, everything under that directory) — per the confirmed decision to retire manual-entry in favor of the Reader-based flow exclusively. Search the codebase for any other link pointing at `/selections/new` and remove/redirect it.
**Done when:**
- `/library` has a working "+ Add from Reader" (or equivalently-named) entry point per Library Section tag, landing on `/reader?librarySection=<name>` with that mode pre-set-and-active (per Ticket 21's behavior).
- `app/selections/new/` no longer exists; visiting that URL directly returns Next.js's normal 404 (no dangling broken link anywhere else in the app).
- Adding a Scripture Selection via this new path successfully saves to `scripture_selections`, verified live in a real browser.
- `tsc --noEmit`, `eslint`, `next build` clean.
**Do not:**
- Do not delete or alter `lib/selections/scriptureSelectionActions.ts`'s `createScriptureSelection` — only the standalone form route goes away, not the underlying write path (the Reader-based flow already uses it, per Flow 1b in `architecture.md`).

**Superseded 2026-09-01, confirmed:** the shipped entry point (`components/library/AddScriptureFromReaderLink.tsx`) is a single generic "+ New Scripture" link to `/reader?from=library`, not a per-Section-tag link to `/reader?librarySection=<name>` as this ticket specified — the Section choice is made once inside the Reader's own picker instead of at the Library entry point, avoiding a second, parallel Section-picker UI on the Library side (which the correction pass explicitly removed). `from=library` only drives the "Back to Library" label; see Ticket 21's superseded-note above for how a direct `?librarySection=` link (still supported, just no longer this ticket's own entry point) is now pre-selected rather than ignored.

---

### Ticket 23: Formula `item_types`/marking-table migration

**Tier:** Senior-required
**Required capability:** Senior-required — must run in the user-selected senior-capability mode, not a fresh Junior session.
**Why kept back:** this is the first tracked migration this repository will ever have for `item_types` — every prior change to that field was applied live and untracked in Production (a known, previously-flagged gap in `progress-tracker.md`'s 2026-08-25 Decisions Made entry). There is no existing migration to copy the shape of for editing a `jsonb` array nested inside `templates.sections`, and this change touches `architecture.md`'s Absolute Invariant "A Section only offers the Item types listed in its `templates.sections[].item_types` whitelist" directly.
**Depends on:** none
**Precedent (if any):** `supabase/migrations/20260826010000_fix_straight_apostrophes_in_section_names.sql` for the general shape of "a migration that edits `templates.sections` jsonb in place" (that one edited Section names inside the array; this one edits `item_types` arrays inside the array) — the closest existing pattern, though it edited a different field.
**Files to touch:** one new migration file; `lib/liturgy/markableSections.ts` (`FORMULA_MARK_SECTIONS`, `getFormulaMarks`); `components/liturgy/SectionCard.tsx` (delete `FORMULA_EXCLUDED_SECTIONS` and its usage, since the database whitelist now enforces the same exclusion).
**Files to NOT touch:** any Selection-marks logic (`DIALOGUE_MARK_SECTIONS`/`getSelectionMarks`) — Formula-only ticket.
**Spec:**
Write a migration that, for both templates' `sections` jsonb arrays, removes `'formula'` from the `item_types` array for exactly these three Sections: Charge (Morning), The Great Commission (Vesper), Benediction (both templates — it appears once per template). Leave every other Section's `item_types` untouched, including the other five Sections confirmed as Formula-eligible (Assurance of Pardon, Affirmation of Faith ×2 templates, Words of Thanksgiving). Use a targeted `jsonb` update (matching by Section `name` within the array, following whatever approach `20260826010000_fix_straight_apostrophes_in_section_names.sql` used for its own targeted in-array edit) rather than replacing the whole `sections` column wholesale — the goal is a minimal, auditable diff against the live data, not a full reseed.
Then update `markableSections.ts`: set `FORMULA_MARK_SECTIONS` to exactly —
```typescript
const FORMULA_MARK_SECTIONS: Record<string, Exclude<TextMark["type"], "bold">[]> = {
  "Assurance of Pardon": ["minister", "congregation"],
  "Words of Thanksgiving": ["congregation"],
};
```
(Charge/Great Commission/Benediction removed entirely — they're no longer Formula-eligible at all, so they need no entry.) Update `getFormulaMarks`'s Affirmation of Faith special case so **both** `kind` values (`"covenant"` and `"affirmation"`/default) return `["congregation", "small_caps"]` — currently only `"covenant"` does; `"affirmation"` returns `[]`. Delete `FORMULA_EXCLUDED_SECTIONS` from `SectionCard.tsx` and every place it's referenced (it gated Benediction's "+ Formula" add button as an app-code-only guard; the database whitelist now enforces the same thing, so the parallel mechanism is redundant and should be removed, not left in place as a second guard).
**Done when:**
- The live `item_types` query used to discover this list (`select t.name, s->>'name' from templates t, jsonb_array_elements(t.sections) as s where s->'item_types' ? 'formula'`) returns exactly: Assurance of Pardon, Affirmation of Faith (×2), Words of Thanksgiving — Charge/Great Commission/Benediction no longer appear.
- `getFormulaMarks("Affirmation of Faith", "affirmation")` and `getFormulaMarks("Affirmation of Faith", "covenant")` both return `["congregation", "small_caps"]`.
- `getFormulaMarks("Words of Thanksgiving")` (no `kind` arg needed — it's not Affirmation of Faith) returns `["congregation"]`.
- `FORMULA_EXCLUDED_SECTIONS` no longer exists anywhere in the codebase (`grep -r "FORMULA_EXCLUDED_SECTIONS"` returns nothing).
- The Compile View no longer offers "+ Formula" on Charge, Great Commission, or Benediction, verified live against real Morning and Vesper liturgies.
- `npm run db:reset` replays cleanly; `npm test`, `tsc --noEmit`, `eslint`, `next build` clean.
- Any pre-existing placed Formula item inside Charge/Great Commission/Benediction (if one exists in real data) is confirmed to still render correctly (removal governs adding only, per the existing Invariant precedent for whitelist changes — "an already-placed item never disappears if its type later drops off the whitelist").
**Do not:**
- Do not touch the `item_types` array for any Section beyond the three named ones.
- Do not remove any already-placed Formula item's data — this is an add-time whitelist change only.
- Do not skip writing this as a tracked migration in favor of another live/untracked Production edit — closing that gap is part of this ticket's purpose.

---

### Ticket 24: Song multi-Section tagging

**Tier:** Senior-required
**Required capability:** Senior-required — must run in the user-selected senior-capability mode, not a fresh Junior session.
**Why kept back:** this is the first many-to-many/join-table relationship in a schema that otherwise has no array or join-table columns at all (every existing relationship is either a foreign key or a scoping text column) — a genuinely new schema pattern, not an extension of an existing one. It also requires a real judgment call (same-title duplicate detection) the confirmed plan explicitly left as "attempt to detect/merge" rather than a fully pinned-down algorithm.
**Depends on:** none
**Precedent (if any):** none for the join-table shape itself; `lib/liturgy/translationPairing.ts` for the general style of a small dedicated `lib/liturgy/` module handling a cross-row relationship, though its shape (a self-referencing `paired_id` FK) is structurally different from a join table.
**Files to touch:** one new migration (`supabase/migrations/<timestamp>_song_section_tags.sql`), `lib/songs/getSongs.ts`, `lib/songs/songActions.ts`, `lib/liturgy/getSectionNames.ts` (the `"song"` case), the Compile View's Section-filtered Song picker (`SectionCard.tsx`/`AddSongPanel.tsx`, wherever songs are currently filtered by `section_name`).
**Files to NOT touch:** `songs.translation`/`songs.paired_id` and their existing pairing logic — unrelated to Section tagging, must continue working unchanged.
**Spec:**
Create a new join table:
```sql
create table song_section_tags (
  song_id uuid not null references songs(id) on delete cascade,
  section_name text not null,
  primary key (song_id, section_name)
);
alter table song_section_tags enable row level security;
```
Backfill: for every existing row in `songs`, insert one `song_section_tags` row from its current `section_name`. Then attempt same-title (within the same `kind` — a Psalm never merges with a Hymn) duplicate detection: for any set of `songs` rows sharing an identical `title` (exact string match) and `kind`, treat them as the same underlying Song that was duplicated across Sections under the old one-row-per-Section model — merge by keeping one canonical row (the earliest-created, or your own reasoned choice — state which and why) and re-pointing every duplicate's `section_name` as an additional `song_section_tags` row on the canonical row instead, then either delete the duplicate `songs` rows or leave them and only migrate the tags (your call — but any placed `SongItem.songId` referencing a row you delete would become a dangling reference, so if you choose to delete, you must also re-point any `section_items` rows referencing a merged-away `songs.id` to the canonical id first; if that's not safely automatable, leave duplicate rows in place, migrate only the tags, and flag the leftover duplicates for manual review instead of guessing). Do not merge anything beyond an exact title+kind match — a near-match (different casing, extra whitespace) should be flagged for manual review, not auto-merged.
Rewrite `getSongs.ts` to join through `song_section_tags` instead of filtering on `songs.section_name` directly (an optional `sectionName` filter now means "has a tag for this Section," not "its one Section equals this"). Rewrite the Compile View's Section-filtered picker and `getSectionNames("song")` the same way. Keep `songs.section_name` as a column for now if dropping it risks breaking something not yet found (state your reasoning either way — dropping it is not required by this ticket, only ensuring nothing still depends on it as the source of truth).
**Done when:**
- `song_section_tags` exists, backfilled with one row per existing Song's original Section, RLS enabled.
- The Compile View's "Add Song" picker for a given Section shows every Song tagged for that Section, including a Song tagged for multiple Sections appearing correctly in each one without duplication of the underlying row.
- The duplicate-detection pass's outcome (how many exact title+kind duplicates were found, how each was resolved — merged or flagged) is reported in your completion report, not just silently applied.
- `npm run db:reset` replays cleanly; `npm test`, `tsc --noEmit`, `eslint`, `next build` clean; live-verified against local Supabase: a Song tagged for two Sections is placeable from both, and a real pre-existing duplicate (if any exist locally) is handled per your stated approach.
**Do not:**
- Do not merge anything beyond exact title+kind matches.
- Do not delete a `songs` row that's still referenced by a `section_items.data.songId` without first re-pointing that reference — a dangling reference must never be created silently.
- Do not touch `songs.translation`/`paired_id` pairing logic.

---

### Ticket 25: Prayer kind moves to a per-placement Compile View toggle

**Tier:** Senior-required
**Required capability:** Senior-required — must run in the user-selected senior-capability mode, not a fresh Junior session.
**Why kept back:** `prayers.kind` currently drives `resolveItemText.ts`'s `leaderOnly` derivation for Prayer (Bulletin-visibility) — an already-load-bearing field this ticket repurposes from "a property of the library entry" to "a property of where/how it's placed." That's a real behavior-and-meaning change to an existing mechanism, not a new field addition, and the per-Section default lookup's storage mechanism (a code lookup vs. a new column) is an open judgment call the confirmed plan didn't fully pin down.
**Depends on:** none
**Precedent (if any):** `lib/liturgy/amenPolicy.ts` for the shape of "a per-Section default policy, resolved in code, with a per-instance override stored on the placed item" — the closest existing pattern for exactly this kind of per-Section-default-plus-per-placement-override mechanism.
**Files to touch:** `components/prayers/PrayerForm.tsx` (remove the `kind` field/select entirely from create/edit), `lib/prayers/prayerActions.ts` (`createPrayer`/`updatePrayer` — remove `kind` from their signatures, or make it vestigial/ignored — your call, state which), a new `lib/liturgy/prayerKindPolicy.ts` (per-Section default, mirroring `amenPolicy.ts`'s shape), `components/liturgy/SectionCard.tsx` (new on/off switch UI for a placed Prayer, plus the Confession-of-Sin-defaults-on/everything-else-defaults-off logic), `types/liturgy.ts` (`PrayerItem` — needs its own per-placement `kind`/`isCorporate`-style field, since the library `Prayer.kind` is going away as the source of truth for placement behavior), `lib/liturgy/resolveItemText.ts` (Prayer's `leaderOnly` derivation, currently `prayer?.kind === "leader"` — must switch to reading the new per-placement field on the `PrayerItem` itself, not the library row).
**Files to NOT touch:** `prayers.is_guide` and `PrayerGuidePanel.tsx`'s existing guide-reference display — placeability (`is_guide`) is a separate concept from audience (`kind`) per the existing 2026-07-23 redesign, and only audience/`kind` is moving in this ticket; do not conflate the two.
**Spec:**
Remove `kind` entirely from `PrayerForm.tsx`'s create/edit fields and from what gets submitted — a Prayer's library row no longer carries an audience distinction at creation time. Add a per-Section default policy in `prayerKindPolicy.ts`: `getDefaultPrayerKind(sectionName: string): "corporate" | "leader"` returning `"corporate"` for exactly "Confession of Sin" and `"leader"` (i.e. Guide-only/off) for every other Section — mirror `amenPolicy.ts`'s exact structural shape (a typed lookup with a documented default-fallback). Add a per-placement `kind`/on-off field to `PrayerItem` (name it consistently with the rest of that type's snapshot fields), initialized from the Section's default policy value at placement time (same "snapshot at placement" convention `SongItem`/existing `PrayerItem` fields already follow) and changeable afterward via a new on/off switch rendered on the placed Prayer in `SectionCard.tsx`. Update `resolveItemText.ts`'s Prayer case to derive `leaderOnly` from this new per-placement field on `item` (the `PrayerItem` itself), not from `prayer?.kind` (the library row) — this is the actual behavior-and-meaning change this ticket exists to make.
**Done when:**
- `PrayerForm.tsx` no longer has a Kind field; creating/editing a Prayer in the Library never sets an audience.
- Placing a Prayer into Confession of Sin defaults its on/off switch to on/Corporate; placing it anywhere else defaults to off/Guide.
- Toggling the switch on an already-placed Prayer changes its Bulletin visibility (`leaderOnly`) live, independent of any other placement of the same library Prayer elsewhere (i.e. the same library Prayer placed in two different Sections can have different on/off states — confirms this is genuinely per-placement, not still secretly global).
- `PrayerGuidePanel.tsx`'s `is_guide`-driven reference display is completely unaffected by any of this.
- `npm test`, `tsc --noEmit`, `eslint`, `next build` clean; live-verified against local Supabase: place the same library Prayer into Confession of Sin and into a different Section, confirm each gets its own independent on/off state and correct Bulletin-visibility behavior in a real docx export.
**Do not:**
- Do not touch `is_guide`/`PrayerGuidePanel.tsx` — placeability stays exactly as it is today.
- Do not leave `resolveItemText.ts` reading from the library row's old `kind` field anywhere — that's the actual bug this ticket closes; a partial fix that still reads the old field in some path is not done.

---

### Ticket 26: Library add-modal (Song/Prayer/Formula)

**Tier:** Senior-required
**Required capability:** Senior-required — must run in the user-selected senior-capability mode, not a fresh Junior session.
**Why kept back:** this introduces a new UI pattern (a multi-field form inside a modal) that doesn't exist anywhere in this codebase today — the only existing modal usage (`components/ui/Modal.tsx`) is for short confirm dialogs, not a full create/edit form; there is no precedent to mechanically copy. It also depends on Tickets 23-25's field changes all being final before its field sets can be built correctly.
**Depends on:** Ticket 23 (Formula's marking table), Ticket 24 (Song's multi-Section tagging), Ticket 25 (Prayer's kind removal) — this ticket's three field sets are only correct once all three land.
**Precedent (if any):** `components/ui/Modal.tsx` for the base modal shell (dialog semantics, focus containment, Escape dismissal — already fully accessible per the 2026-08-25 Modal accessibility work) as the wrapper; `SongForm.tsx`/`PrayerForm.tsx`/`FormulaForm.tsx` for the field logic to relocate inside it — reuse these components' internals rather than rewriting field logic from scratch.
**Files to touch:** new `components/library/AddLibraryItemModal.tsx` (or a small family of type-specific modal components sharing one sized shell — your call on exact composition, but the three modals must be visually the same size regardless of type, per the confirmed decision), `/library`'s page/tab components (wire the modal trigger in place of the old `/new` page links), deletion of `app/songs/new/`, `app/prayers/new/`, `app/formulas/new/` entirely.
**Files to NOT touch:** `SongForm.tsx`/`PrayerForm.tsx`/`FormulaForm.tsx` internals beyond what's needed to host them inside a modal instead of a page (their field logic, validation, and submit-handling should be reused, not rewritten).
**Spec:**
Build a modal-shell component wrapping `Modal.tsx`, sized identically across all three item types. Inside it, render the appropriate existing form component (`SongForm`/`PrayerForm`/`FormulaForm`, each already updated by Tickets 23-25's changes — Song now Section-tag-multi-select via `song_section_tags`, Prayer with no Kind field, Formula with the Ticket 23 marking table wired through `getFormulaMarks`), triggered from a "+ Add [Song/Prayer/Formula]" control on `/library`'s corresponding tab. On successful save, close the modal and refresh the Library list (matching whatever revalidation pattern the existing forms' `router.push("/library")` was achieving — likely `router.refresh()` instead, since there's no longer a page navigation to rely on). Delete `app/songs/new/`, `app/prayers/new/`, `app/formulas/new/` entirely once the modal path is confirmed working — do not leave the old pages in place as a redundant second entry point.
**Done when:**
- All three item types can be created from `/library` via the new modal, with the exact field sets confirmed in the charter session (Song: Section tags multi-select, Kind, Title, Versification/author [Psalm-only], Year published, Additional Information, Language, Translation-of; Prayer: Section, Title, Prayer Content, Language, Translation-of, no Kind; Formula: Title, Content, marking toolbar per Ticket 23's table, Language, Translation-of).
- All three modals are visually the same size; only their field content differs.
- `app/songs/new/`, `app/prayers/new/`, `app/formulas/new/` no longer exist; no dangling link anywhere in the app points at them.
- `tsc --noEmit`, `eslint`, `next build` clean; live-verified in a real browser: create one of each item type via the new modal, confirm it appears correctly in `/library` afterward with all fields saved.
**Do not:**
- Do not rewrite `SongForm`/`PrayerForm`/`FormulaForm`'s field/validation logic — host the existing components, don't reimplement them.
- Do not leave any of the three old `/new` pages reachable after this ticket completes.
