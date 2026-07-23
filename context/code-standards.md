<!-- Code standards: rules the agent must follow when writing code for this project -->

# Code Standards

Implementation rules and conventions for the entire project. The AI agent must follow these in every session without exception. These rules prevent pattern drift across sessions.

---

## Engineering Mindset

- Think before implementing — understand what is being built and why before writing a single line
- Scope is sacred — only build what the current feature requires (see build-plan.md's phase boundaries; don't pull work forward from a later phase)
- Clean over clever — simple readable code is always preferred
- UI before logic — every feature gets a mock-data UI pass before real data is wired in, per build-plan.md's Core Principle
- One thing at a time — complete one feature fully before touching the next

---

## Language & Type Safety

- Strict mode enabled — no exceptions
- Never use `any` — use `unknown` and narrow the type
- All function parameters and return types must be explicitly typed
- Use `const` by default — only use `let` when reassignment is necessary

---

## File and Folder Naming

- Folders: kebab-case
- Component files: PascalCase
- Utility files: camelCase
- One component per file

---

## Component / Module Structure

```
imports → types → component/function → exports
```

- No inline styles — all styling via design tokens from ui-tokens.md
- No business logic inside UI components — components render and call functions from `lib/`, they don't contain Lord's Day math, dedup checks, or PDF logic themselves

---

## API / Backend Conventions

**Decided, confirmed by the shipped codebase:** Next.js Server Actions for all data mutations (creating a Liturgy, saving an Item, editing a Formula, deleting an Item via `removeItemAction.ts`) — this is an internal single-user tool with no public API surface to expose, so Server Actions avoid the extra boilerplate of a REST-shaped route for every mutation. The one API route in the codebase is `app/api/liturgy/[id]/export/route.ts` (PDF streaming) — the sole case needing raw HTTP semantics a Server Action can't provide.

```typescript
// Server Action structure
"use server";

export async function actionName(input: InputType): Promise<{ success: boolean; data?: T; error?: string }> {
  // validate input first
  // perform the operation
  // return the shared result shape below
}
```

- Every Server Action validates its input before processing
- Always return `{ success: boolean, data?, error? }` — never throw across the server/client boundary
- Never expose raw database or provider error messages to the client — translate to a human-readable message first

---

## Database

- Never query the DB directly from a component — always through `lib/liturgy` or `lib/bible`
- **No `user_id` scoping in v1** — this is a single-user tool with no auth. Do not add a `user_id` column speculatively; that arrives with Supabase Auth when v3's access control is built, not before.
- Use a transaction for any operation touching more than one table — e.g., creating a `liturgies` row and its `sections` rows together

---

## Error Handling

- Never use empty catch blocks — always log or handle
- User-facing errors must be human-readable, not raw exception text
- Log errors with a context prefix: `[module/function]` — e.g., `[lib/liturgy/dedup] citation already exists in this Section`

---

## Analytics Events

None — no analytics in v1, per project-overview.md.

---

## Environment Variables

| Variable | Used In |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/db/supabase.ts` — the one place the Supabase client is instantiated |
| `SUPABASE_SERVICE_ROLE_KEY` | `lib/db/supabase.ts` — server-side only, never exposed to the client |

**Corrected 2026-07-18** — this table previously also listed `NEXT_PUBLIC_SUPABASE_ANON_KEY` as used for "client-side reads." No such variable is used anywhere in the codebase — there is no browser Supabase client in this app at all (see `library-docs.md`'s Usage Pattern 1); every read and write goes through `lib/db/supabase.ts`'s single server-only client via a Server Action or Server Component. Both required env vars must be set in any deployment target (e.g. Vercel's Project Settings → Environment Variables) — the app fails at build/module-load time (`createClient(undefined, undefined)` throws immediately) if either is missing, which surfaces as `Failed to collect page data for /api/...` during a production build.

---

## Comments

- No comments explaining what the code does — code must be self-explanatory
- Comments only for why — e.g., explaining the dedup-on-citation-not-text decision inline where it's implemented, since that reasoning isn't obvious from the code alone

---

## Text Formatting

- Type curly quotation marks and apostrophes (' ' " ") directly in any hardcoded UI string literal — never straight marks (' "). This covers copy the agent writes in code (button labels, empty states, error messages), not stored liturgical content — that's normalized separately at write-time (see architecture.md's invariants).

---

## Dependencies

Approved dependencies for this project:

- `next`, `react`, `typescript` — framework and language
- `@supabase/supabase-js` — database client
- `@react-pdf/renderer` — PDF generation (frozen; retained until docx export is proven stable, see build-plan.md v2 item 1)
- `docx` — .docx generation (v2 item 1), replacing `@react-pdf/renderer` as the export mechanism going forward
- `tailwindcss` (v4) — styling

Do not install any other packages without updating this list first.

---

## Shared Helpers Over Per-Surface Reimplementation

This project renders the same compiled Liturgy content across three surfaces (Compile View, PDF export, Web View) that must never visually drift from each other. The established pattern: when a rendering rule is shared by two or more surfaces, put it in one function in `lib/liturgy/` or `lib/text/` and have every surface call it — never reimplement the same logic three times with three chances to diverge. Concrete precedents: `resolveItemText.ts` ("what does this item display"), `sectionTitle.ts` (dynamic Section naming), `applyMarks()` (mark-segment splitting), `prepareSectionRender.ts` (header-reference/merge layout), `resolveVerbalCueTemplate.ts` (v2 — resolving a Verbal Cue's `{{scripture}}`/`{{song}}`/`{{creed}}` tokens against whatever's actually placed in its Section, called from `resolveItemText.ts` itself so it reaches all three renderers automatically). When a genuinely new per-surface constraint shows up (e.g. react-pdf can't render arbitrary React components, so `MarkedText.tsx` can't be imported into the PDF), the fallback is each surface implementing the same branch logic independently against the same shared low-level helper (`applyMarks()`) — not three independent implementations of the whole rule from scratch.

## Icon Components

Shared icon set lives in `components/liturgy/icons.tsx` — one named export per icon (`PencilIcon`, `TrashIcon`, `ClearIcon`, `NoteIcon`, `DownloadIcon`, `CopyLinkIcon`, `CheckIcon`), each a small inline SVG, `strokeWidth="2"`, accepting `size`/`className` props. Check this file before hand-rolling a new inline `<svg>` in a component — most icon needs in this app are already covered, and a new one-off icon should be added here rather than inlined at its call site, so future icon-weight/style changes stay a one-file edit.

## Deployment (Vercel)

The Vercel project is connected to this repo's `main` branch and auto-deploys on push. Two things worth knowing from the first real deploy (2026-07-18):

- **Environment variables must be set in Vercel's Project Settings → Environment Variables** (same two values as `.env.local` — see Environment Variables above) before the first build; missing them causes a build-time crash (`Failed to collect page data for /api/...`), not a runtime error, since `lib/db/supabase.ts` creates its client at module-load time.
- **If a deployment looks stale after a fix**, check the specific deployment's **Source** line (commit SHA) before assuming the code is wrong — Vercel's "Redeploy" on an old failed build re-deploys *that build's commit*, not necessarily your latest push. When in doubt, push a fresh commit (an empty one is fine — `git commit --allow-empty`) to force a new deployment unambiguously tied to the current `main` HEAD.
- **Every page that reads library/liturgy data from Supabase and can be revisited after a save must export `export const dynamic = "force-dynamic"`.** Without it, Next can serve a cached fetch response after `router.refresh()` instead of re-querying the database — the save genuinely succeeds, but the page the user sees doesn't reflect it, which looks exactly like a lost edit (found live 2026-07-22 on `/library`, the Compile View, the liturgy Web View, and the Reader — all missing this, now fixed). `app/page.tsx` had it from the start for the same reason. Check for this explicitly on any new `async function ...Page()` added later.
