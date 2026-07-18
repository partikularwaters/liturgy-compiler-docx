<!-- UI tokens: the design system values the agent must use for all styling -->

# UI Tokens

Design tokens for the Liturgy Compiler. All colors, typography, spacing, and component values defined here. Use these exact values throughout the codebase — never hardcode colors or use raw Tailwind color classes in components.

---

## How to Use

This project uses **Tailwind CSS v4**. All design tokens are defined using the `@theme` directive in `app/globals.css`. No `tailwind.config.ts` needed for colors or tokens.

Tailwind v4 automatically generates utility classes from `@theme` variables:

- `--color-accent` → `bg-accent`, `text-accent`, `border-accent`
- `--color-surface` → `bg-surface`, `text-surface`, `border-surface`

```tsx
// Correct — uses generated utility classes
className="bg-surface text-text-primary border-border"

// Also correct — references CSS variable directly
style={{ color: 'var(--color-text-primary)' }}

// Never — hardcoded hex values
className="bg-[#F7F6F2] text-[#22201C]"

// Never — raw Tailwind color classes
className="bg-purple-500 text-gray-600"
```

---

## globals.css — Complete Token Definition

```css
@import "tailwindcss";

@theme {
  /* Font */
  --font-sans: "Inter", sans-serif;
  --font-serif-display: "Old Standard TT", serif;
  --font-serif-body: "Ibarra Real Nova", serif;

  /* Page and surface backgrounds — warm, paper-toned rather than stark white,
     since the app is read-heavy (bilingual Scripture, long liturgical text) */
  --color-background: #F7F6F2;
  --color-surface: #FFFFFF;
  --color-surface-secondary: #F1EFE9;

  /* Borders */
  --color-border: #E3DFD5;
  --color-border-light: #ECE9E1;

  /* Text */
  --color-text-primary: #22201C;
  --color-text-secondary: #6B6558;
  --color-text-muted: #A39C8C;

  /* Primary accent — deep burgundy, in the register of confessional Reformed
     print heritage rather than a generic SaaS blue/purple */
  --color-accent: #7A2E38;
  --color-accent-dark: #5C1F27;
  --color-accent-light: #F3E3E5;
  --color-accent-foreground: #FFFFFF;

  /* Success */
  --color-success: #3F7355;
  --color-success-light: #E1EEE4;
  --color-success-foreground: #2A4F3B;

  /* Info */
  --color-info: #4A6C8C;
  --color-info-light: #E4ECF3;
  --color-info-foreground: #2E4A63;

  /* Warning */
  --color-warning: #B8792E;
  --color-warning-light: #F6EFD8;
  --color-warning-foreground: #FFFFFF;

  /* Error — deliberately distinct from the burgundy accent, not a shade of it.
     error-light is intentionally warmer/more saturated than a literal light-tint
     formula would give — a naive blend lands within a few RGB units of
     accent-light, and the two need to stay visually distinguishable even at
     small sizes (e.g. a marker badge). */
  --color-error: #A33B34;
  --color-error-light: #EBD4D2;
  --color-error-foreground: #FFFFFF;

  /* v1.1 redesign tokens — both explicitly provisional, revisited later in v1
     per Madrid's own note when he approved them (see redesign-plan-v1.1.md §A/K) */

  /* CTA yellow — the top nav bar's "Create Liturgy"/"Browse Library" button,
     chosen for contrast against the burgundy nav bar, not a semantic warning */
  --color-cta-yellow: #F0B429;
  --color-cta-yellow-foreground: #3A2B00;

  /* Citation red — Scripture reference small-caps text (Compile View, PDF).
     Deliberately a distinct token from --color-error, not a reuse of it — reusing
     error would make red mean both "something's wrong" and "this is a Bible
     reference" simultaneously. Value corrected 2026-07-16 (Feature 24) to the
     confirmed real hex #C00000 extracted from the reference bulletin docx
     (redesign-plan-v1.1.md §AB) — was a provisional guess (#C0392B) before. */
  --color-citation: #C00000;

  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
}
```

---

## Color Usage Guide

### Page Layout

| Element | Token |
| --- | --- |
| Page background | `bg-background` |
| Card / surface | `bg-surface` |
| Secondary surface | `bg-surface-secondary` |
| Default border | `border-border` |
| Light border | `border-border-light` |

### Typography

| Element | Token |
| --- | --- |
| Headings, primary text | `text-text-primary` |
| Secondary text, labels | `text-text-secondary` |
| Placeholder, muted | `text-text-muted` |

### Accent (Primary Color)

Used for: primary buttons, active nav items, focus rings, the "already saved" citation marker in the Reader.

| Element | Token |
| --- | --- |
| Button background | `bg-accent` |
| Button text | `text-accent-foreground` |
| Light badge background | `bg-accent-light` |

### Status Colors

| Status | Background | Text |
| --- | --- | --- |
| Success | `bg-success-light` | `text-success-foreground` |
| Info | `bg-info-light` | `text-info-foreground` |
| Warning (solid, e.g. buttons) | `bg-warning` | `text-warning-foreground` |
| Warning (light, e.g. highlights) | `bg-warning-light` | `text-text-primary` |
| Error (solid, e.g. buttons) | `bg-error` | `text-error-foreground` |
| Error (light, e.g. markers/badges) | `bg-error-light` | `text-error` |

### v1.1 redesign colors

| Element | Token |
| --- | --- |
| Top nav bar background | `bg-accent` (the existing burgundy accent, applied as a full bar fill — the one deliberate exception to "color goes inside cards/bars via badges and text, never on the surface itself," since this is chrome, not a card) |
| Top nav bar CTA background | `bg-cta-yellow` |
| Top nav bar CTA text | `text-cta-yellow-foreground` |
| Scripture citation text (small caps) | `text-citation` |

---

## Typography

| Element | Size | Weight | Line height | Color token |
| --- | --- | --- | --- | --- |
| Page heading | 28px | 700 | 36px | `text-text-primary` |
| Section heading | 18px | 600 | 26px | `text-text-primary` |
| Body text | 15px | 400 | 24px | `text-text-primary` |
| Label | 13px | 500 | 18px | `text-text-secondary` |
| Muted / timestamp | 12px | 400 | 16px | `text-text-muted` |

Body text is set at 15px rather than the more common 14px default — this app displays long bilingual Filipino/English Scripture passages with diacritics, where slightly larger body copy meaningfully helps readability.

Font family: **Inter** — import via `next/font/google`, never use a fallback system font. (Corrected 2026-07-12 — this line previously said "IBM Plex Sans," which conflicted with this file's own `@theme` block and with ui-rules.md; Inter is correct and matches what's implemented.)

---

## Spacing

| Token | Value | Usage |
| --- | --- | --- |
| `gap-2` | 8px | Badge and tag gaps |
| `gap-4` | 16px | Section internal gaps |
| `gap-6` | 24px | Between Sections in the Compile View |
| `p-4` | 16px | Card padding |
| `p-6` | 24px | Large card padding |
| `px-4 py-2` | 16/8px | Button padding |
| `px-3 py-1` | 12/4px | Badge padding |

---

## Component Tokens

### Cards

```
background:    bg-surface
border:        1px solid var(--color-border)
border-radius: rounded-lg
padding:       p-6
box-shadow:    0px 1px 3px rgba(34, 32, 28, 0.08)
```

### Buttons

**Primary:**

```
background:    bg-accent
text:          text-accent-foreground
border-radius: rounded-md
padding:       px-4 py-2
font-weight:   font-medium
```

**Secondary:**

```
background:    bg-surface
border:        border border-border
text:          text-text-primary
border-radius: rounded-md
padding:       px-4 py-2
```

**Ghost:**

```
background:    transparent
text:          text-text-secondary
hover:         hover:bg-surface-secondary
border-radius: rounded-md
```

### Input Fields

```
background:  bg-surface
border:      border border-border
border-radius: rounded-md
padding:     px-3 py-2
text:        text-text-primary
placeholder: text-text-muted
focus:       ring-1 ring-accent
```

### Badges

Used for the citation "already saved" marker and the leader-only Verbal Cue indicator.

```
border-radius: rounded-full
padding:       px-2 py-0.5
font-size:     text-xs
font-weight:   font-medium
```

---

## Invariants

- Never use hex values directly in components — always use CSS variables via Tailwind tokens
- Font is **Inter** — always import via `next/font/google`, never use a fallback system font. (This line previously said "IBM Plex Sans," a stale leftover that conflicted with this file's own `@theme` block and the Typography section above; corrected 2026-07-16.)
- Never use raw Tailwind color classes like `bg-purple-500` or `text-gray-600` — use project tokens only
- The burgundy accent (`--color-accent`) is the only *primary* accent color — never use Tailwind's built-in color scale for it. `--color-cta-yellow` and `--color-citation` (added v1.1) are narrowly-scoped exceptions for the top nav CTA and Scripture citations specifically, not general-purpose accents — don't reach for them outside those two uses.
- All borders default to `--color-border` — never use `border-gray-*`
- `lib/pdf/tokens.ts` mirrors this file's hex values for react-pdf, which has no Tailwind/CSS-variable access — update both together if a token changes (see `library-docs.md`)
