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
- **Old Standard TT (`--font-serif-display`)** — liturgy and Section display headings (e.g. "Call to Worship" as shown in the Compile View and PDF exports)
- **Ibarra Real Nova (`--font-serif-body`)** — the actual displayed Scripture/liturgical body text (Selections, Formulas, Prayers) — chosen specifically for its strong multilingual diacritic support, which bilingual Filipino/English liturgical text needs

**Invariant (2026-07-15): any serif text rendered `italic` must use a real italic font file, never a browser-synthesized oblique.** Both `Old_Standard_TT` and `Ibarra_Real_Nova` loaders must include `style: ["normal", "italic"]` — omitting it (the original state of this codebase until this fix) means the browser fakes italics by skewing the upright glyphs, which drops the font's actual italic design (proper ligatures, swashes, distinct letterforms). Verified via `document.fonts`: with `style` set, a genuine `italic` weight-700 Ibarra Real Nova face loads and reports `status: "loaded"` rather than being synthesized. Check this whenever adding a new serif font or a new italic usage — an `italic` class with no matching `style` entry in the loader is the bug pattern to watch for.

---

## Layout

- Page max-width: 960px, centered — narrower than a typical dashboard, since content here is reading-focused prose (liturgical text), not dense data grids
- Main content area padding: 32px on all sides
- Gap between page-level sections: 32px
- **v1.1: top bar, not a sidebar** — see Top Bar below. Content area sits below the bar at full width, still centered/capped per-page as needed (the Compile View's 2-page/3-column layout is the one exception — see Compile View Layout below).
- The Reader's reading column narrows on wide screens to open real left-margin space for the sticky Citation/Text panel (see Sticky Citation/Text Panel below) — not an overlay.

---

## Top Bar (v1.1 — replaces the Sidebar)

**Reverses the original "no top navbar" decision** (`project-overview.md`'s Navigation section). Full-width horizontal bar, `bg-accent` (the existing burgundy accent used as a full chrome fill — the one deliberate exception to Cards' "never a colored surface" rule below, since this is navigation chrome, not a card).

- All items — **Liturgies** · **Bible Reader** · one contextual CTA slot — sit **grouped together on the right side** of the bar with uniform spacing between all three (not split with the nav links on the left and the CTA pushed to the far right — that read as "too far apart" and was corrected 2026-07-15).
- **The bar's inner content is wrapped in the same `max-w-[960px] mx-auto px-8` container every page uses**, so the CTA's right edge lines up exactly with the right edge of the page content below it (verified pixel-for-pixel: content left/right edges both land at the same x-coordinate as the nav's). Never let the bar's content span the full viewport independent of the page's own margin — that was the original bug.
- The CTA slot reads **Create Liturgy** on the homepage (`/`) and swaps to **Browse Library** while inside the Liturgy Compiler page (`/liturgies`) or a Compile View (`/liturgy/[id]`) — same slot, different label/destination depending on route, not two separate items
- CTA styling: `bg-cta-yellow` / `text-cta-yellow-foreground`, `rounded-md` — the one place a yellow token is used
- No Sign In/Account item in v1 — that arrives with v3 auth, not before
- Active item (Liturgies/Bible Reader): distinguish from inactive via text weight/opacity against the bar fill, not a left-border indicator (that pattern was Sidebar-specific and doesn't read the same way on a horizontal bar)

---

## Cards

Every Section in the Compile View, and every list item in the Formula/Prayer libraries, lives in a card.

```
background:    bg-surface
border:        1px solid var(--color-border)
border-radius: 12px
padding:       24px
box-shadow:    0px 1px 3px rgba(34, 32, 28, 0.08)
```

Never use colored card backgrounds — always `bg-surface`. Color goes inside cards via badges and text, never on the card surface itself. (The Top Bar's solid `bg-accent` fill is chrome, not a card, and is the one place this rule doesn't apply — see Top Bar above.)

---

## Compile View Layout (v1.1)

**Morning Worship** (built, Feature 17, 2026-07-15): **2 pages, 3 columns each**, mimicking the physical bulletin's real page/column structure. Each Section is still its own card, placed inside its assigned Page/Column per `context/redesign-plan-v1.1.md` §F's fixed assignment table — Section→column placement is data (`templates.sections.page`/`.column`), not a layout the user rearranges in v1. Container widens to `max-w-[1400px]` (up from the standard 960px) to give three columns of reading-focused card content room to breathe; each physical page is a `grid grid-cols-3 gap-6` with a "Page N" muted uppercase label above it. Page 1, Column 1 carries the bulletin's own title/date/Lord's Day heading (`font-serif-display` 22px) above its first Section card — this is page furniture, not a Section, and only ever renders there. The Download Leader Guide/Bulletin buttons sit in a persistent toolbar above both pages, outside the print-mimicking area.

**Vesper Worship** (deferred to Feature 18): no Section→column assignment exists yet, so Vesper's Compile View still renders the original flat single-column list (`max-w-[960px]`), same as before this feature. `lib/liturgy/groupSectionsByPageColumn.ts` is the fallback switch — it returns `null` whenever any Section is missing `page`/`column` data, and both `app/liturgy/[id]/page.tsx` and `lib/pdf/LiturgyDocument.tsx` render the flat layout in that case. This isn't a temporary hack to remove later — it's the intended mechanism for Vesper to adopt the same layout once Feature 18 defines its column table, with zero code changes needed at that point (just data).

This 2-page/3-column shape is the one deliberate exception to the 960px-centered-single-column Layout principle above — reading-focused prose still applies *within* each Section card, but the page as a whole now mirrors a real two-page bulletin spread rather than a single scrolling list.

## Output Format — Morning vs. Vesper (v1.1)

- **Morning:** both the Compile View and the PDF export (Leader Guide/Congregation Bulletin) use the 2-page/3-column shape — verified via `pdftotext -layout`, both physical PDF pages present with Sections in the exact column order `redesign-plan-v1.1.md` §F specifies. PDF column text runs smaller than the flat layout's (11px → 8.5px body, 14px → 10.5px heading) since each column is roughly a third of the page width; the Compile View's on-screen cards keep their normal size since there's no print-width constraint there.
- **Vesper:** the Compile View uses the same flat single-column shape it always has (see above — the 3-column shape is deferred, not yet "the same shape as Morning" in practice), and there is no PDF in v1 — Vesper liturgies get a shareable, mobile-first responsive Liturgy Web View instead (Feature 18, built 2026-07-15: `app/liturgy/[id]/view`, `components/liturgy/LiturgyWebView.tsx`; single-column, standard responsive patterns, not the 3-column shape). Vesper's PDF export is deferred to v3/v4. The Compile View's "Download Leader Guide/Bulletin" buttons are replaced with a single "View / Share Liturgy" link (opens in a new tab) whenever the liturgy has no `page`/`column` data — i.e. Vesper today. **The Web View component itself is template-agnostic** (reads the same `CompiledLiturgy` shape as the PDF path, ignores `page`/`column` entirely, always renders in template order) — it already works correctly for Morning liturgies too when navigated to directly, deliberately built that way so extending it to Morning later (per `redesign-plan-v1.1.md`'s "Morning could gain the same view later" note) is just adding a visible link, not new component work.

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

**Liturgical display headings (Old Standard TT)** — e.g. a Section's own title as rendered inside a card or PDF:

```
22px / 600 / 30px line-height / text-text-primary
```

**Liturgical body text (Ibarra Real Nova)** — Selections, Formulas, Prayers as displayed:

```
17px / 400 / 1.75 line-height / text-text-primary
Congregational/unison lines (bold markdown): 17px / 700 / 1.75
```

**v1.1 additions:**

```
Scripture citation (universal):         small caps, text-citation
Metrical Psalm title (congregation-facing): title case, italic, text-citation
Hymn title (congregation-facing):       title case, italic, text-text-primary (no red — not Scripture)
Rubric-styled Verbal Cue:               sentence case, italic, text-text-primary
Homepage hero line (2026-07-15):        32px / 700 / 1.4 line-height / font-serif-body / italic, left-aligned (revised from the original 22px/font-serif-display/centered treatment — bigger, bolder, and switched fonts per direct feedback)
```

Leader/Congregation/Minister responsive-reading spans (see the Leader/Congregation/Minister Tool section below) inherit the surrounding body-text size/weight — the speaker label itself ("Ldr:", "Congr:", "Min:") renders in small caps to distinguish it from the spoken content that follows.

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

---

## Verse Marker (v1.1 redesign) — built, Feature 19, 2026-07-15

Reverses the neutral-gray/square-not-circle marker decisions from the original build session:

- **Addable ("+")** — red glyph in a yellow box: `bg-cta-yellow text-error`, `w-6 h-6 rounded-sm`, was `bg-surface-secondary text-accent`. Still a real `<button>` — clicking stages the verse.
- **Pending ("−")** — unchanged, light-red treatment (`bg-error-light` / `text-error`), still a real `<button>` — click removes it. Explicitly not addressed by the redesign per `redesign-plan-v1.1.md` §H.
- **Saved** — `<sup className="text-success text-[13px]">●</sup>`, not a button. This is a mechanism change, not just a color swap: a passive typographic mark (unicode "●", no `onClick`, no `disabled`), replacing the prior disabled `bg-success-light` square badge. `VerseDisplay.tsx` branches on `marker.state === "saved"` to render this instead of the shared `<button>` markup the other two states use.

## Sticky Citation/Text Panel (Reader, v1.1) — built, Feature 19, 2026-07-15

When compiling a Selection, `ReaderClient.tsx` switches from a single `max-w-[960px]` column to a two-column `flex items-start gap-6` layout: a `w-[340px] shrink-0 sticky top-8` sidebar (the `AddSelectionPanel`/hint text, then the success message below it — reversed from the original above-the-panel placement) beside a `flex-1 min-w-0` reading column holding `VerseDisplay`. `items-start` on the flex row aligns the sidebar's top edge with the reading column's top edge on initial layout; `sticky top-8` then keeps it pinned as the reader scrolls a long chapter — a real CSS mechanism, not an overlay, so the reading column genuinely narrows to make room rather than the panel floating on top of it. Plain browsing (no `liturgyId` in the URL) is unaffected — no sidebar renders, `VerseDisplay` sits alone in the original single `max-w-[960px]` column, verified live at both states.

## Leader / Congregation / Minister / Small Caps Tool (v1.1)

A span-tagging tool for responsive-reading text, available only on Call to Worship, Prayer of Invocation (both templates), and the Church Covenant portion of Affirmation of Faith/Church Covenant (Vesper). Three independent tags — **Leader**, **Congregation**, **Minister** (Minister further restricted to Assurance of Pardon, Charge, Great Commission, Benediction only) — plus a manual **Small Caps** mark for the Divine Name (YHWH → "PANGINOON"/"LORD").

- Tags are stored as separate structured spans (start/end position + type) attached to the item's text — **never baked into the raw saved text**. Un-marking a span is a clean, lossless operation; the underlying prose is never mutated.
- Display: a Leader/Congregation/Minister-tagged span renders with its speaker label ("Ldr:"/"Congr:"/"Min:", small caps) prefixed, indented per standard responsive-reading convention.
- Everywhere else in the app, the existing `**bold**` markdown convention (`lib/text/markdown.ts`) remains the live option for marking congregational/unison lines — this tool doesn't replace it, just supersedes it in practice on the four Sections listed above.

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

Every list that can be empty needs one — the homepage's recent-liturgies preview, the Liturgy Compiler page's history list, a freshly-started Section with no Items yet, an empty library category on the Browse Library page.

- Short descriptive text in `text-text-muted`
- Optional icon above the text
- CTA button if there's a logical next action (e.g. "Start your first liturgy" on an empty homepage)

**Heading-only Sections (v1.1):** Prayer Meeting and The Lord's Table (Vesper) intentionally show no item picker at all — just their Section heading, and for The Lord's Table, a single administrator-name field beneath it. This isn't a not-yet-built empty state; it's the deliberate final behavior for these two Sections.

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
