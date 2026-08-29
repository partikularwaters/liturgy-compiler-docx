<!-- UI rules: how the interface behaves — layout, interactions, and component patterns -->

# UI Rules

Concise rules for building the Liturgy Compiler UI. These cover the patterns and constraints needed to keep the interface consistent without over-specifying every detail.

---

## Fonts

Three typefaces, three distinct jobs — never interchange them.

```typescript
import { Inter, Old_Standard_TT, Ibarra_Real_Nova } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const oldStandardTT = Old_Standard_TT({ subsets: ["latin"], weight: ["400","700"], style: ["normal","italic"], variable: "--font-old-standard-tt" });
const ibarraRealNova = Ibarra_Real_Nova({ subsets: ["latin"], weight: ["400","600","700"], style: ["normal","italic"], variable: "--font-ibarra-real-nova" });
```

Apply all three font variable classes to the `<html>` tag in root layout. Never use a fallback system font for any of the three.

- **Inter (`--font-sans`)** — all UI chrome: nav, buttons, labels, badges, form inputs, timestamps
- **Old Standard TT (`--font-serif-display`)** — liturgy and Section display headings *outside the Compile View/export surfaces* (e.g. the Reader's chapter heading) — see the exception below, this is no longer used inside the Compiler itself
- **Ibarra Real Nova (`--font-serif-body`)** — the actual displayed Scripture/liturgical body text (Selections, Formulas, Prayers) — chosen specifically for its strong multilingual diacritic support, which bilingual Filipino/English liturgical text needs

**Compiled-output exception:** Compile View, DOCX, and the frozen PDF use Ibarra Real Nova for headings and body, distinguishing hierarchy by weight, size, and case rather than switching families. Old Standard TT remains appropriate for deliberately separate reading surfaces such as the Reader and public Web View.

**Invariant (2026-07-15): any serif text rendered `italic` must use a real italic font file, never a browser-synthesized oblique.** Both `Old_Standard_TT` and `Ibarra_Real_Nova` loaders must include `style: ["normal", "italic"]` — omitting it (the original state of this codebase until this fix) means the browser fakes italics by skewing the upright glyphs, which drops the font's actual italic design (proper ligatures, swashes, distinct letterforms). Verified via `document.fonts`: with `style` set, a genuine `italic` weight-700 Ibarra Real Nova face loads and reports `status: "loaded"` rather than being synthesized. Check this whenever adding a new serif font or a new italic usage — an `italic` class with no matching `style` entry in the loader is the bug pattern to watch for.

---

## Layout

- Page max-width: 960px, centered — narrower than a typical dashboard, since content here is reading-focused prose (liturgical text), not dense data grids
- Main content area padding: 32px on all sides
- Gap between page-level sections: 32px
- Use the floating navigation pill below, never a sidebar.
- The Reader's reading column narrows on wide screens to open real left-margin space for the sticky Citation/Text panel (see Sticky Citation/Text Panel below) — not an overlay.

---

## Floating Navigation Pill

Desktop navigation is a centered, floating surface rather than a full-width colored bar. It contains permanent Home, Liturgies, Bible Reader, and Library destinations, a Create Liturgy action, and `AccountMenu`. Active state uses weight/color within the pill; it never uses a sidebar-style border.

- Collapse to a hamburger-driven menu on mobile while preserving every destination and account action.
- The pill auto-hides after a downward scroll and reappears near the top of the page or after an upward scroll. Route changes close the mobile menu; they do not otherwise reset the pill's scroll-hidden state.
- The public `/liturgy/[id]/view` surface renders no application navigation.
- Navigation chrome uses the established surface, border, shadow, radius, and accent tokens; it does not create page-specific contextual destinations.

---

## Cards

Every list item in the Formula/Prayer libraries lives in a card.

```
background:    bg-surface
border:        1px solid var(--color-border)
border-radius: 12px
padding:       24px
box-shadow:    0px 1px 3px rgba(34, 32, 28, 0.08)
```

Never use colored card backgrounds — always `bg-surface`. Color goes inside cards via badges and text, never on the card surface itself.

`SectionCard` deliberately does not use the generic card box. The Compile View follows the plain printed-bulletin treatment (`flex flex-col gap-2`) without a border, shadow, or colored surface.

---

## Compile View Layout (v1.1)

**Morning Worship:** the Compile View mirrors the fixed two-page/three-column bulletin structure. Section placement comes from Template page/column data, the container widens to accommodate the spread, and artifact/share controls remain in a toolbar outside the content surface.

**Vesper Worship:** without page/column assignments, the Compile View uses the established flat single-column layout. `groupSectionsByPageColumn.ts` returns `null` for that data shape and the page deliberately selects the flat renderer.

This 2-page/3-column shape is the one deliberate exception to the 960px-centered-single-column Layout principle above — reading-focused prose still applies *within* each Section card, but the page as a whole now mirrors a real two-page bulletin spread rather than a single scrolling list.

## Output Formats

- Both templates expose Leader Guide and Congregation Bulletin DOCX downloads plus the public, responsive Web View.
- DOCX uses continuous Word columns and optional authored Section breaks; it does not reproduce the Compile View's fixed screen grid.
- The PDF renderer is buried, explicit-opt-in compatibility behavior. Do not derive current UI or new output requirements from it.

---

## Typography Hierarchy

**UI chrome (Inter):**

```
Page heading:      28px / 700 / 36px line-height / text-text-primary
Section heading:   18px / 600 / 26px / text-text-primary
Body:              15px / 400 / 24px / text-text-primary
Label:             13px / 500 / 18px / text-text-secondary
Muted / timestamp: 12px / 400 / 16px / text-text-muted
```

**Liturgical display headings (Old Standard TT)** — the Reader's chapter heading and `LiturgyWebView`'s Section headings only (see the Fonts section's Feature 28 Part A exception — the Compile View/PDF use Ibarra Real Nova for headings instead):

```
22px / 600 / 30px line-height / text-text-primary
```

**Liturgical body text (Ibarra Real Nova)** — Selections, Formulas, and Prayers use 16px / 1.6 across `SectionCard`, the public Web View, and the equivalent compiled-output treatment. The legacy PDF uses 12pt, approximately 16px at screen density.

```
16px / 400 / 1.6 line-height / text-text-primary / text-justify across compiled-content surfaces
Congregational/unison lines (bold markdown): 16px / 700 / 1.6
```

**v1.1 additions, updated 2026-07-18:**

```
Scripture citation (universal, en-dash-normalized): small caps, text-citation
Metrical Psalm title (congregation-facing):         title case, italic, text-citation, NOT small-caps (see below)
Hymn title (congregation-facing):                   title case, italic, text-text-primary (no red — not Scripture)
Rubric-styled Verbal Cue:                            sentence case, italic, text-text-primary
Homepage hero line (2026-07-15):                     32px / 700 / 1.4 line-height / font-serif-body / italic, left-aligned
```

**Real bug fixed 2026-07-18: a Metrical Psalter's title must never go small-caps, even when it shares the header-reference mechanic with Scripture citations.** The two are visually similar (both citation-red) but semantically different — small-caps is a *reference* typesetting convention, and a Psalm title is naturally-cased prose, not a reference. `prepareSectionRender.ts`'s `HeaderInfo` carries `citationColor`/`smallCaps` as two independent flags for exactly this reason — a Selection citation gets both, a Psalm title gets only `citationColor` (plus `italic`).

Leader/Congregation/Minister responsive-reading spans (see the Leader/Congregation/Minister Tool section below) inherit the surrounding body-text size/weight — the speaker label itself ("Min:"/"Congr:") renders in small caps to distinguish it from the spoken content that follows. **As of 2026-07-18, the Congregation-marked span (label + text) also renders fully bold**, and a Congregation/Minister block gets `mb-2` (≈8px) spacing after it — deliberate, replacing what had read as an unintentionally huge gap (traced to old manually-typed "Minister:"/"Congregation:" text prefixes stacking with the new automatic label on legacy Formula content; the underlying prose in those specific instances still needs a manual cleanup pass, flagged separately, not a CSS bug).

---

## Badges

All badges use `border-radius: 9999px` (pill shape).

```
padding:     2px 10px
font-size:   11px
font-weight: 500
```

Established variants:
- **Already used elsewhere** — `bg-success-light` / `text-success-foreground` — shown in the Reader and Compile View when a citation is already saved to the current Section
- **Leader only** — `bg-accent-light` / `text-accent-dark` — marks a Verbal Cue that won't appear in the Congregation Bulletin export
- **Morning** — `bg-morning` / `text-morning-foreground` — approved highlighter-yellow identity tag in `LiturgyDateRow` (2026-08-30)
- **Vesper** — `bg-vesper` / `text-vesper-foreground` — approved dark-navy identity tag in `LiturgyDateRow` (2026-08-30)

---

## Verse Marker (v1.1 redesign) — built, Feature 19, 2026-07-15

Reverses the neutral-gray/square-not-circle marker decisions from the original build session:

- **Addable ("+")** — red glyph in a yellow box: `bg-cta-yellow text-error`, `w-6 h-6 rounded-sm`, was `bg-surface-secondary text-accent`. Still a real `<button>` — clicking stages the verse.
- **Pending ("−")** — unchanged, light-red treatment (`bg-error-light` / `text-error`), still a real `<button>` — click removes it. Explicitly not addressed by the redesign per `redesign-plan-v1.1.md` §H.
- **Saved** — `<sup className="text-success text-[13px]">●</sup>`, not a button. This is a mechanism change, not just a color swap: a passive typographic mark (unicode "●", no `onClick`, no `disabled`), replacing the prior disabled `bg-success-light` square badge. `VerseDisplay.tsx` branches on `marker.state === "saved"` to render this instead of the shared `<button>` markup the other two states use.

## Sticky Citation/Text Panel (Reader, v1.1) — built, Feature 19, 2026-07-15

When compiling a Selection, `ReaderClient.tsx` switches from a single `max-w-[960px]` column to a two-column `flex items-start gap-6` layout: a `w-[340px] shrink-0 sticky top-8` sidebar (the `AddSelectionPanel`/hint text, then the success message below it — reversed from the original above-the-panel placement) beside a `flex-1 min-w-0` reading column holding `VerseDisplay`. `items-start` on the flex row aligns the sidebar's top edge with the reading column's top edge on initial layout; `sticky top-8` then keeps it pinned as the reader scrolls a long chapter — a real CSS mechanism, not an overlay, so the reading column genuinely narrows to make room rather than the panel floating on top of it. Plain browsing (no `liturgyId` in the URL) is unaffected — no sidebar renders, `VerseDisplay` sits alone in the original single `max-w-[960px]` column, verified live at both states.

## Leader / Congregation / Minister / Small Caps Tool (v1.1, completed 2026-07-18)

A span-tagging tool for responsive-reading text, on both `SelectionItem` and `FormulaItem` (Formula support added 2026-07-18 — the tool originally only reached Selection text). Three independent tags — **Leader** (implicit default, no button needed), **Congregation**, **Minister** (Minister scoped to Formula-based Sections: Assurance of Pardon, Charge, Great Commission, Benediction) — plus **Small Caps**, now available on **every Section that can hold a Selection** (`lib/liturgy/markableSections.ts`'s `getSelectionMarks()`), not just the two dialogue Sections. Congregation stays scoped to the Sections that genuinely alternate speaking parts: Call to Worship, Prayer of Invocation, Assurance of Pardon (Formula), and the Church Covenant portion of Affirmation of Faith/Church Covenant (Formula, Vesper).

- Tags are stored as separate structured spans (start/end position + type) attached to the item's `text`/`overrideText` — **never baked into the raw saved text**. Un-marking a span is a clean, lossless operation; the underlying prose is never mutated. Editing the text no longer wipes existing marks (fixed 2026-07-18, `shiftMarksForEdit()`) — only marks actually touched by the edit shift/resize.
- Display: a Congregation-tagged span renders indented + labeled ("Congr:", small caps) + **fully bold** (label and text both); a Minister-tagged span renders flush-left + labeled ("Min:", small caps), normal weight; a Small-Caps-tagged span renders inline with no label, `font-variant: small-caps`. A `mb-2` gap follows every Congregation/Minister block.
- The marking toolbar's live preview (`MarkEditor.tsx`) is **always visible**, even on Sections with no marking toolbar at all (i.e. `availableMarks` empty) — it's the only way to confirm Bold formatting before saving, since a plain `<textarea>` can't render it itself. A universal **Bold** button sits on the same toolbar row on every form that uses `MarkEditor` (Add/Edit Scripture, Formula, Prayer), regardless of Section.
- **2026-07-23: Bold is a real mark now (`type: "bold"`), not `**markdown**`.** It used to be the one exception that mutated raw text with literal asterisks instead of pointing at it, which broke whenever an exclusive mark's boundary fell inside a `**...**` span.
- **2026-07-23, corrected same day: Small Caps moved from the exclusive Congregation/Minister group into an independent overlay, same as Bold.** It was originally grouped in as a third "exclusive" option, which was wrong — Small Caps is a typographic convention (reverential capitalization), orthogonal to *who's speaking*, not a competing claim on the range. Treating it as exclusive meant marking a word inside an existing Congregation span split that span into two separate rendered blocks with the word visually isolated onto its own line between them. Only Congregation/Minister remain mutually exclusive with each other now; Bold and Small Caps may each freely combine with a Congregation/Minister span, with each other, or stand alone — all resolved together in one place, `lib/text/marks.ts`'s `applyMarks()`.
- PDF-specific: Congregation/Minister each get their own block (a real line break); Leader and Small Caps flow inline in one shared `<Text>` — a real bug (fixed 2026-07-18) had every segment, including plain unmarked text, wrapped in its own block `<View>`, which read as "marking a word turns it into its own paragraph." Small Caps substitutes `textTransform: "uppercase"` in the PDF (react-pdf has no small-caps glyph support) — this is layout-based marking (indent + label), the one part of this tool with no PDF/CSS rendering gap; the small-caps *typography* itself is the one genuine platform limitation.

## Verbal Cue Defaults (v1.1)

Every Section gets a default Verbal Cue at its start except an explicit per-template exclusion list (see `context/redesign-plan-v1.1.md` §V.1 for the full list — mostly Sections with no natural bridging moment: Sermon, Benediction, Doxology, the Communion-administration run, Prayer Meeting, Pastoral Prayer). The textbox shows a grayed-out placeholder — standard placeholder behavior, disappears on typing — pre-filled from a per-Section bilingual sample script, with `{title}`/`{citation}` tokens substituted for real values already added to that Section when available (never literal brackets). Confession of Sin (Morning) additionally gets a **Rubric-styled** Verbal Cue at its end — see Typography Hierarchy above — for the fixed post-confession instruction; this is a second, distinct cue in the same Section, not a replacement for the default start-of-Section one.

---

## Buttons

**Primary:**

```
background:    bg-accent
color:         text-accent-foreground
border-radius: 8px
padding:       8px 16px
font-size:     14px
font-weight:   500
```

**Secondary:**

```
background:    bg-surface
border:        1px solid border-border
color:         text-text-primary
border-radius: 8px
padding:       8px 16px
```

**Ghost:**

```
background:    transparent
color:         text-text-secondary
hover:         bg-surface-secondary
border-radius: 8px
```

**Large / Hero CTA (2026-07-15)** — for the homepage's primary Create Liturgy/Browse Library pair only, not a general-purpose size. Scaled up from the standard Primary/Secondary button so the homepage's entry-point actions read with the same visual weight as `TemplatePicker`'s "Morning Worship"/"Vesper Worship" cards, per direct feedback that the original size was too small for its role:

```
padding:       16px 32px
font-size:     18px
font-weight:   600 (primary) / 500 (secondary)
```

Same `bg-accent`/`bg-surface` background pairing as standard Primary/Secondary otherwise.

**Small-control geometry:** choose radius with the control's actual height. Compact square controls (including 24px verse markers) use `rounded-sm`; compact text controls use `rounded-md`; pill geometry is reserved for badges or explicitly pill-shaped controls. Do not apply a large default radius to a small control and assume the token name guarantees the intended shape.

**Add-item outline (Feature 28 Part A, 2026-07-16)** — the "+ Selection"/"+ Formula"/"+ Cue"/"+ Prayer"/"+ Sermon" triggers inside `SectionCard`, ~25% smaller than Secondary and transparent-fill instead of `bg-surface`, matching the reference bulletin's compact plus-icon buttons:

```
background:    transparent
border:        1px solid border-border
border-radius: 6px (rounded-md)
padding:       6px 12px
font-size:     11px
color:         text-accent-dark
hover:         bg-accent-dark, text-accent-foreground, border-accent-dark (box and text colors invert)
```

Sits in its own row below the Section name (not beside it, per the same spec) — see `SectionCard` in `ui-registry.md`. Labels are now "+ Scripture" (not "+ Selection" — UI-facing wording only, changed 2026-07-18; the underlying type/table/action names are all still `selection`/`Selection`, deliberately not renamed).

---

## Form Inputs

```
background:        bg-surface
border:             1px solid border-border
border-radius:      8px
padding:            8px 12px
font-size:          14px
color:               text-text-primary
placeholder color:  text-text-muted
focus:               ring-1 ring-accent border-accent
```

**Native date inputs (2026-07-15):** attach `onClick={(e) => e.currentTarget.showPicker?.()}` so clicking anywhere in the field opens the native calendar popup, not just the small calendar-icon glyph the browser renders by default. The whole field should feel clickable, not a tiny hitbox inside it.

---

## Table

Used in the Browse Library page (Formulas, Prayers, Songs, Existing Selections — merged from the original separate Formula/Prayer library pages, v1.1) and the Liturgy Compiler page's history list.

- No alternating row colors — `bg-surface` rows only, separated by border
- Row border: `1px solid border-border` between rows
- Column headers: uppercase, 12px, font-weight 500, `text-text-secondary`
- Row text: 14px, `text-text-primary`
- Hover state: `background: bg-surface-secondary`

---

## Empty States

Every true list that can be empty needs one — the homepage's recent-liturgies preview, the Liturgy Compiler page's history list, and library categories.

- Short descriptive text in `text-text-muted`
- Optional icon above the text
- CTA button if there's a logical next action (e.g. "Start your first liturgy" on an empty homepage)

**Heading-only Sections (v1.1):** Prayer Meeting and The Lord's Table (Vesper) intentionally show no item picker at all — just their Section heading, and for The Lord's Table, a single administrator-name field beneath it. This isn't a not-yet-built empty state; it's the deliberate final behavior for these two Sections.

An empty Section shows only its heading and available add controls across Compile View and read-only outputs. It is not treated as a list empty state.

---

## Trinitarian Seal

The None/Filipino/English toggle is available for Selection content in Benediction, as defined by `TRINITARIAN_SEAL_SECTIONS`. Formula was removed from Benediction's Compile View add controls 2026-08-25 (`FORMULA_EXCLUDED_SECTIONS` in `SectionCard.tsx`) specifically to close the ambiguity of a Section-scoped toggle applying to two different item types at once — the toggle now unambiguously targets the one item type left. The wording is approved domain content and is never improvised. It is appended at resolution time, remains separate from the raw stored prose, and receives a real `bold` mark through the shared rendering path. Add/edit forms use the same control and live-preview treatment.

## Item Deletion

Every item type (Selection, Formula, Verbal Cue, Prayer, Sermon, Song) can be removed from a Section via a trash-icon button (`TrashIcon`, see Icon Set below) next to its Edit control — added 2026-07-18, closing a real standing gap (no item type had a delete path before this). One shared confirm-then-delete flow (`window.confirm`, then `lib/liturgy/removeItemAction.ts`'s `removeItem()`) for all six types — never a per-type delete action. Song items get a delete button with no accompanying Edit button, since there's no edit form for a placed Song yet.

## Icon Set

Shared icons live in `components/liturgy/icons.tsx` (see `code-standards.md`) — `PencilIcon` for every "Edit" affordance (replaced plain-text "Edit" links project-wide, 2026-07-18), `TrashIcon` for delete, `ClearIcon` (a circled X) for the marking toolbar's Clear action, `NoteIcon` for the marking toolbar's collapsible how-it-works help, `DownloadIcon` prefixing the Guide/Bulletin download buttons (which now read just "Guide"/"Bulletin", not "Download Leader Guide"/"Download Congregation Bulletin"), `CopyLinkIcon`/`CheckIcon` for `CopyLinkButton.tsx` (replaced the old "View / Share Liturgy" text link — click copies the Web View URL to the clipboard, shows a "Copy Link" hover tooltip, and briefly swaps to a checkmark on success). All stroke-width 2.

## Legacy PDF — Frozen Page Format

Morning's 3-column PDF: **13in × 8in landscape** (`[936, 576]` points — replaced A4 portrait, gives the 3 columns a wider page), margins **0.3in top/bottom, 0.25in left/right** (tightened from a uniform 48pt to maximize page use), and pagination moved from a top-left "Page N" label to a **fixed bottom-right footer** (`position: "absolute", bottom, right`). Vesper's fallback flat-layout PDF (unused, no link points to it — see Compile View Layout below) still uses A4 portrait, unaffected.

---

## Motion & Animation

Established 2026-08-27, Phase 0 of the emil-design-eng design-engineering charter — the project's first motion standard. Values live in `ui-tokens.md`'s Motion section; this section governs *when* and *whether* to use them. Follows the `emil-design-eng` skill's framework directly; consult that skill for the full reasoning behind any rule below.

**This app's own frequency map** — read this before defaulting to "add an animation":

| Surface | Frequency | Default posture |
| --- | --- | --- |
| Reader (verse markers, chapter navigation, highlight toggling) | Very high — the Compiler and congregation both hit these constantly | No animation, or as close to none as possible. Never animate a keyboard-initiated action here. |
| Compile View (`SectionCard`, Add panels, item add/remove/edit) | Occasional per session, but a real session touches it dozens of times | Standard, restrained animation — feedback and spatial consistency only |
| Library management (Formula/Prayer/Song/Selection tables, inline edit) | Occasional | Standard animation |
| Modals, forms, floating nav pill | Occasional | Standard animation |
| Public Liturgy Web View, homepage | Rare per visitor (most congregation members open a liturgy once a week) | Can carry a considered entrance treatment, but stay restrained — this surface is content-first, not a marketing page |

**Before adding any animation, answer in order:**
1. **Should this animate at all?** Check the frequency map above. A 100+/day action gets nothing. Tens/day gets none or drastically reduced. Occasional gets the standard treatment. Rare/first-time can carry more.
2. **What is the purpose?** Spatial consistency, state indication, feedback, or preventing a jarring appear/disappear. "It looks nice" is not sufficient justification on a frequently-seen element.
3. **What easing?** Entering/exiting → `--ease-out-strong`. Moving/morphing on screen → `--ease-in-out-strong`. Hover/color change → CSS `ease`. Never `ease-in` on a UI element — it delays the movement the user is watching most closely, which reads as sluggish even at an identical duration.
4. **What duration?** Use the matching token from `ui-tokens.md` — `--duration-press` (160ms), `--duration-tooltip` (150ms), `--duration-dropdown` (200ms), `--duration-modal` (250ms). Every UI animation in this app stays under 300ms; longer is reserved for marketing/explanatory motion this app doesn't currently have any of.

**Hard constraints:**
- Never animate a keyboard-initiated action.
- Only animate `transform` and `opacity` — both skip layout/paint. Never animate `padding`/`margin`/`height`/`width`/`top`/`left`.
- Respect `prefers-reduced-motion: reduce` on every animation added: keep opacity/color transitions that aid comprehension, drop movement/position transforms.
- Never animate from `scale(0)` — start from `scale(0.9)` or higher, combined with `opacity: 0`.
- A popover/dropdown scales from its trigger (`transform-origin` set to the trigger's position), never from center. Modals are the one exception — they stay `transform-origin: center` since they're not anchored to a trigger.
- Prefer CSS transitions over `@keyframes` for anything that can be triggered rapidly or interrupted (toasts, toggled panels) — transitions retarget smoothly mid-animation, keyframes restart from zero.
- Every `hover:` class is gated behind `@media (hover: hover) and (pointer: fine)` automatically — `globals.css` redefines Tailwind's own `hover` variant project-wide (`@custom-variant hover`), so no component needs to opt in by hand. **Found unenforced across all four charter phases by a `review-animations` audit (2026-08-28)** — this line originally described a per-component instruction that was never actually followed; fixed at the mechanism level instead of retrofitting every call site. Touch devices fire hover on tap and would otherwise get a stuck/false-positive state until the next tap elsewhere.

**Review format:** any animation audit or change is presented as a Before/After/Why markdown table (the emil-design-eng skill's required format), confirmed before implementation — not a prose list.

**Implementation gotcha (found in Phase 1, 2026-08-27):** Tailwind's single-property transition utilities (`transition-colors`, `transition-transform`, etc.) each set the CSS `transition-property` declaration outright — they don't merge. Stacking `transition-colors` and `transition-transform` as two classes on one element does not transition both; the second declaration silently wins and the other property change (e.g. an `active:scale` press effect on an element that also has a `hover:` color change) applies instantly with no easing at all. Always combine multiple animated properties into one arbitrary-value utility instead: `transition-[color,transform]`, not `transition-colors transition-transform`. This is exactly how the entrance transitions on Modal/dropdowns already combine `opacity,transform` — apply the same pattern anywhere a hover-color state and a press-feedback transform share an element.

---

## Tailwind v4 Note

This project uses Tailwind v4. Tokens are defined with `@theme` in globals.css — no `tailwind.config.ts` needed. Never define colors in a config file. Always use `@theme` for new tokens.

---

## Do Nots

- Never use Tailwind's built-in color classes (`bg-purple-500`, `text-gray-600`) — use project tokens only
- Never define colors in `tailwind.config.ts` — use `@theme` in globals.css
- Never add gradients to card backgrounds
- Never use the liturgical serifs (Ibarra Real Nova, Old Standard TT) for UI chrome — they're reserved for displayed Scripture/liturgical text only; mixing them into buttons or nav blurs the deliberate sacred-text/interface distinction
- Never render a leader-only Verbal Cue in the Compile View without its "Leader only" badge — what will be excluded from the Bulletin must always be visible during compilation
- Never show raw error messages to users — always show human-readable text
- Never bake a Leader/Congregation/Minister/Small Caps span tag into an item's raw saved text — always a separate structured mark (v1.1, see Leader/Congregation/Minister Tool above)
- Never use `text-citation` (or reuse `text-error`) for anything other than a Scripture citation or an actual error state — the two must stay semantically distinct even though both are red-family (v1.1)
- Never offer Add Selection on the five dynamic song Sections (Psalm/Hymn of Adoration, Propitiation, Proclamation, Dedication, Communion) — those take Psalm/Hymn only, a Scripture-reading Selection doesn't belong in a sung slot (v1.1)
- Never show the compiler's own top nav bar on the public Liturgy Web View (`/liturgy/[id]/view`) — it's meant to be the liturgy alone, shared with a congregation member who has no reason to see internal nav (2026-07-18)
- Never apply small-caps to a Metrical Psalm title, even though it shares the citation-red color with a Scripture citation — small-caps is a reference-only convention, a Psalm title is naturally-cased prose (2026-07-18, see Typography Hierarchy above)
- Never animate a Reader verse-marker click, chapter navigation, or any other keyboard-initiated/very-high-frequency action — see Motion & Animation above (2026-08-27)
- Never hand-write a transition duration or easing curve inline — always reference a Motion token from `ui-tokens.md` (2026-08-27)
