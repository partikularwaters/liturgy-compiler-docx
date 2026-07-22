# Liturgy Compiler (docx)

A web application for **Reformed Life Community Church** that lets a liturgist compile Scripture, fixed liturgical formulas, and original prayer into a complete, coherent order of worship — with a built-in bilingual Bible reader and Word (`.docx`) export for both the presiding leader and the congregation.

This repo is the **production successor** to the original `liturgy-compiler` project. It replaces that project's PDF export pipeline with native Word document generation and continuous-flow, multi-column authoring — see [Why this repo exists](#why-this-repo-exists) below.

**Live:** https://liturgy-compiler-three.vercel.app

---

## What it does

- **Compile a liturgy** — pick Morning or Vesper Worship and a service date; the Lord's Day number is computed automatically. Every Section of the template is laid out on one screen while you build it, so the whole service is visible at once instead of living only in the compiler's head.
- **Bible reader** — full self-hosted text in Filipino (AB1905) and English (BSB), plus a licensed BibleGateway hover-preview widget for AB2001/MBB wherever a reference appears. Highlight a passage and assign it directly to a Section.
- **Reusable libraries** — Formulas, Prayers (with reference Prayer Guides), Psalms/Hymns, and every Scripture passage ever used are all saved to a shared library, independent of any one liturgy, with a Minister/Congregation/Small-Caps marking toolbar for dialogic text (e.g. the Absolution).
- **Word export** — generates a Leader Guide (every item) and a Congregation Bulletin (public-facing items only) as real `.docx` files, using Word's native multi-column layout with manual column-break overrides — no custom pagination engine required.
- **Shareable Web View** — a mobile-first, no-chrome page for any liturgy, linkable directly.
- **Default Verbal Cues** — new liturgies seed each Section with a starting spoken cue, which dynamically names whatever Scripture/Song/Formula is actually placed there.

---

## Why this repo exists

The original `liturgy-compiler` repo's PDF export (`@react-pdf/renderer`) became increasingly fragile for multi-column layouts. This repo is a full clone of that project, kept as its own independent history, built specifically to:

1. Replace PDF export with native `.docx` generation (the `docx` npm library), which Word can then print, edit by hand, or export to PDF itself.
2. Replace fixed per-Section page/column assignment with continuous-flow authoring — Word's own multi-column layout fills and spills automatically, with a manual "start new column" override per Section.

The original repo's PDF pipeline stays in this codebase (`lib/pdf/`), frozen and untouched, until `.docx` export is fully proven out.

---

## Tech stack

| Layer | Tool |
| --- | --- |
| Framework | Next.js (App Router, Server Actions) |
| Database | Supabase (Postgres) |
| Styling | Tailwind CSS v4, design tokens |
| Language | TypeScript (strict) |
| Word export | [`docx`](https://www.npmjs.com/package/docx) |
| PDF export (legacy, frozen) | `@react-pdf/renderer` |
| Bible text | Self-hosted AB1905 + BSB; BibleGateway RefTag/BGLinks widget for AB2001/MBB (licensed hover preview) |
| Hosting | Vercel |

---

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in your Supabase project's URL + service role key
npm run dev
```

Required environment variables (`.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Database schema changes live in `supabase/migrations/` — apply them against your Supabase project before running the app against fresh data.

---

## Project structure

```
app/            Pages and route handlers (no business logic)
components/     UI components (no direct DB calls)
lib/
  bible/        Bible-provider abstraction (AB1905/BSB/AB2001/MBB)
  liturgy/      Core liturgy logic — templates, Sections, item resolution,
                Verbal Cue templating, docx/PDF-shared rendering prep
  docx/         .docx generation (current export pipeline)
  pdf/          PDF generation (legacy, frozen)
  formulas/ prayers/ songs/ selections/   Library reads/writes
  text/         Typography, markdown bold, Leader/Congregation/Minister marks
types/          Shared TypeScript types
context/        Project documentation (see below) — read before making changes
```

---

## Documentation

The `context/` folder is the source of truth for this project and should be read before any change that touches its domain:

- `context/project-overview.md` — what's being built, for whom, why
- `context/architecture.md` — stack, folder structure, data flows, invariants
- `context/build-plan.md` — phased feature roadmap
- `context/code-standards.md` — conventions, deployment notes
- `context/ui-tokens.md` / `context/ui-rules.md` — design system
- `context/ui-registry.md` — catalog of built components
- `context/progress-tracker.md` — current status, decisions log, session history

---

## Deployment

Connected to Vercel, auto-deploys on push to `main`. Environment variables must be set in Vercel's Project Settings before the first build. See `context/code-standards.md`'s Deployment section for known gotchas (stale deployments, `force-dynamic` requirements for pages that read live data).

---

## This is just a start

This project is a small, hopeful step — one local church's attempt to build a tool it needed and give it away freely rather than sell it. We'd love to see more of this: if you're a developer or designer looking for a way to serve the church with your skills, we'd gladly welcome the company. [Matthew 10:8](https://www.biblegateway.com/passage/?search=Matthew+10%3A8) puts it simply: "Freely you have received; freely give." [Selling Jesus](https://sellingjesus.org/) and [The Dorean Principle](https://thedoreanprinciple.org/) are two thoughtful explorations of that conviction, offered here in case they're an encouragement to you too.
