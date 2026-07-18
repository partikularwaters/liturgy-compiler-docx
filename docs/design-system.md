# Liturgy Compiler — Marketing/Homepage Design System
*For use in Claude Design — extends `ui-tokens.md`, does not replace it*

Inspired by Seed Bible's site (cream base, dark contrast sections, warm accent, loose hand-drawn line art, serif+script type pairing) — with their orange swapped for our existing red family, since the app already means something specific by red (Scripture citations).

---

## 1. Where this fits

`ui-tokens.md` governs the **app** (Compile View, Reader, Library — functional, print-mimicking, burgundy/citation-red). This document governs the **marketing shell** — Homepage (`/`) and any future public-facing pages like the Vesper Web View — which can be warmer and more editorial. Both pull from the same root palette so the transition from marketing → app doesn't feel like two products.

---

## 2. Color

Reuse existing tokens. No new hex values invented — the two "new" entries below are just marketing-scale applications of colors already in `ui-tokens.md`.

| Role | Token | Hex | Seed Bible equivalent |
|---|---|---|---|
| Page background (light sections) | `--color-background` | `#F7F6F2` | their cream |
| Dark section background | *(new)* `--color-ink` | `#22201C` — reuse `--color-text-primary`'s value as a fill | their charcoal/navy section |
| Primary accent (was their orange) | `--color-accent` | `#7A2E38` | their burnt orange |
| Accent hover/deep | `--color-accent-dark` | `#5C1F27` | — |
| Accent tint (badges, soft fills) | `--color-accent-light` | `#F3E3E5` | — |
| Emphasis red (italic callouts, "the one red moment") | `--color-citation` | `#C00000` | their orange-on-dark emphasis text |
| CTA on dark bars | `--color-cta-yellow` | `#F0B429` | — (use sparingly, already flagged provisional) |
| Body text on light | `--color-text-primary` | `#22201C` | their near-black |
| Body text on dark | `--color-background` | `#F7F6F2` | their cream-on-charcoal |
| Muted / secondary | `--color-text-secondary` | `#6B6558` | — |
| Line art stroke (light bg) | `--color-border` at 40–60% opacity | `#E3DFD5` | their pale squiggles |
| Line art stroke (dark bg) | `--color-text-secondary` at 30–40% opacity | `#6B6558` | their gray squiggles |

**Rule carried over from `ui-tokens.md`:** burgundy stays the *only* primary accent. Where Seed Bible uses orange as a big warm block color (their "Why It Matters" section), we use `--color-accent` (burgundy) as that block color instead — not `--color-citation`. Citation red stays reserved for small emphasis moments (italic phrase, quote mark, key word) so it doesn't compete with the app's actual citation-red meaning once someone moves from homepage into the Compiler.

**Section background rotation** (mirrors their light → dark → accent-block → light rhythm):
1. Hero — `--color-background` (cream)
2. Social context / "How it works" — `--color-ink` (dark)
3. Stakes / "Why it matters" — `--color-accent` (burgundy block, was their orange block)
4. Detail / closing — `--color-background` (cream)
5. Footer — `--color-ink` (dark)

---

## 3. Typography

Seed Bible pairs a bold serif display face with an italic script-like serif for emphasis phrases, over clean sans body copy. You already have this exact structure in tokens, just needs a marketing-scale role assignment:

| Role | Font | Token | Seed Bible equivalent |
|---|---|---|---|
| Display headline | Old Standard TT, bold | `--font-serif-display` | their bold serif "Where scripture becomes" |
| Emphasis phrase within headline | Old Standard TT, italic, accent or citation-red color | `--font-serif-display` italic | their italic orange "a shared experience." |
| Nav links, small caps labels | Old Standard TT, italic, underline-on-active | `--font-serif-display` italic | their italic nav ("Home", "Features") |
| Body copy | Inter | `--font-sans` | their sans body |
| Buttons | Inter, medium | `--font-sans` | their pill buttons |

**Scale (marketing only — larger than the app's Typography table):**

| Element | Size | Weight | Line height |
|---|---|---|---|
| Hero headline | 56px | 700 | 64px |
| Hero headline — italic emphasis line | 56px | 400 italic | 64px |
| Section heading | 40px | 700 | 48px |
| Section subheading (italic accent) | 28px | 400 italic | 36px |
| Lede / intro paragraph | 18px | 400 | 28px |
| Body | 16px | 400 | 26px |
| Nav item | 15px | 400 italic | 20px |
| Button label | 15px | 500 | 20px |
| Footer small print | 13px | 400 | 18px |

---

## 4. Logo lockup

Seed Bible's mark: bold geometric wordmark + small circular "studio" badge (AO Lab) top-left, tiny and quiet. For this project:

- Primary lockup: wordmark only — set in Old Standard TT bold caps, tracked out slightly, no icon needed yet (no logo asset exists per project files).
- If/when RLCC supplies a church logo, treat it the way Seed Bible treats "AO Lab": small, top-left, quiet — never competing with the page headline.
- Keep the ~2in logo sizing rule from `redesign-plan-v1.1.md` §AA scoped to the **PDF/Compile View only** — the marketing homepage can size it independently, smaller, as a nav-corner mark.

---

## 5. Buttons

| Variant | Background | Text | Shape | Seed Bible equivalent |
|---|---|---|---|---|
| Primary (hero CTA) | `--color-accent` | `--color-background` | full pill, generous padding (`px-8 py-4`) | their orange "Watch Latest Update" pill |
| Secondary (on dark) | transparent, 1px `--color-background` border | `--color-background` | full pill | their outlined pills ("Pin It.", "Bookmark It.") |
| Nav CTA | `--color-cta-yellow` | `--color-cta-yellow-foreground` | rounded-md (matches existing nav-bar CTA spec) | — |

All marketing buttons are **full pill radius**, distinct from the app's `rounded-md` buttons — this is one of the clearest signals that marketing pages are a different register from the compiler tool itself.

---

## 6. Illustration / line art

This is the single biggest aesthetic borrow, and it's free to take wholesale:

- **Loose, single-weight, hand-drawn squiggle lines** as background decoration — no fill, no gradient, just organic curved strokes wandering across section corners.
- **Simple black-outline figure illustrations** (people, no color fill, minimal facial detail) for "who this is for" / "how it works" moments — appropriate here for depicting a congregation/gathering without depicting any real person.
- Line weight: consistent ~2px stroke, rounded caps.
- Placement: always in *negative space* — corners, behind headlines, never overlapping body text.
- On dark sections, lines drop to ~30% opacity of the light-bg color; on light sections, ~40–60% opacity of `--color-border`.

Suggested subjects for this project specifically (in place of Seed Bible's chat-bubble/phone icons, which don't fit a liturgy tool):
- An open book / Bible outline (echoes the reader)
- A simple candle or communion-cup line icon (sparingly, Reformed-appropriate, not skeuomorphic)
- Wandering squiggle as pure background texture — no literal meaning needed, same as their use

---

## 7. Section anatomy (homepage)

Mapped directly onto `project-overview.md`'s existing Homepage spec (hero line + two CTAs + recent-liturgies preview):

1. **Nav** — cream bg, small mark top-left, italic-serif nav links, one solid CTA pill top-right (this already matches `redesign-plan-v1.1.md` §A's contextual CTA — reuse token, not a new one).
2. **Hero** — cream bg, centered display headline with one italic emphasis line, lede paragraph below, two pill CTAs (Create Liturgy primary / Browse Library secondary), loose line art in the corners.
3. **Recent liturgies preview** — cream or dark, short list/cards, not the full history (full list lives at `/liturgies` per the approved IA).
4. **Closing / footer** — dark `--color-ink` bg, mark + short tagline left, contact/links right, small print centered at the very bottom.

---

## 8. What NOT to carry over

- Their **orange as primary** — replaced everywhere with `--color-accent` (burgundy); `--color-citation` red is reserved for small emphasis only, to protect its meaning inside the app proper.
- Multi-platform chat-app iconography (WhatsApp/Telegram/Discord icons) — not relevant to a single-church internal tool.
- "6 billion people" stat-driven marketing copy tone — this is a solo-user/single-church tool per `project-overview.md`'s Target User section, not a growth-stage product; copy should stay closer to liturgical/pastoral register than startup register.

---

## 9. Open items for you to decide before Claude Design builds from this

- Do you want an actual RLCC church logo/mark, or wordmark-only for now?
- Should the "Why it Matters" burgundy block section exist on this homepage at all, or is that overkill for an internal single-user tool (vs. Seed Bible's public-facing pitch)?
- Confirm: keep `--color-cta-yellow` for the nav CTA as already provisioned in `ui-tokens.md`, or should the marketing nav CTA instead be burgundy-on-cream for more restraint?
