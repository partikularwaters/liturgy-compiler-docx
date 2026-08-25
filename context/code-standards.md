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
- Server Components own initial reads; Client Components own interaction. Never pass a privileged database helper across that boundary.

---

## API / Backend Conventions

Use Next.js Server Actions for application mutations. The artifact export route is the deliberate exception because file responses need raw HTTP semantics; it serves active DOCX downloads and the frozen PDF compatibility format.

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
- Any client-reachable action that uses the service-role client must resolve the current user and enforce role/ownership before its first application-data read or write. Authentication bootstrap actions are exempt.
- Internal privileged helpers include `server-only` protection and are called only by authorized server entry points.
- **Placement and editing of a shared Library entry (Formula/Prayer/Song) are separate authorized operations — a picker component must never assume selecting an existing entry implies consent to edit it.** `AddFormulaPanel.tsx` got this right from the start (an override is a per-instance snapshot, never a write to the shared row). `AddSongPanel.tsx`/`AddPrayerPanel.tsx` didn't (2026-08-25 bug) — their `handleSave()` routed every pick through the Curator-gated `updateSong()`/`updatePrayer()` before placement, even when nothing was edited, so a Compiler picking any unmodified Shared entry was rejected before ever reaching placement. Any future "pick existing vs. write new" picker for a new item type must compare the picked entry's current field values against what's actually being submitted, and only call the edit action when something changed (see `lib/liturgy/pickedLibraryEntryUnchanged.ts` for the extracted, reusable comparison).

---

## Database

- Never query the DB directly from a component — always through `lib/liturgy` or `lib/bible`
- Shared/owned library authorization follows the shipped Curator/Compiler model; do not invent additional roles or ownership semantics.
- Read and write Section Items through `lib/liturgy/sectionItems.ts`. Application inserts omit `position`; the database assigns it atomically and protects `(section_id, position)` with a unique constraint.
- Use a transaction for any operation touching more than one table — e.g., creating a `liturgies` row and its `sections` rows together
- A Template migration that inserts, removes, or reorders slots must migrate affected `sections.template_section_index` values transactionally, using collision-safe staging and verification.

---

## Error Handling

- Never use empty catch blocks — always log or handle
- User-facing errors must be human-readable, not raw exception text
- Log errors with a context prefix: `[module/function]` — e.g., `[lib/liturgy/dedup] citation already exists in this Section`
- Required artifact reads must fail closed. Model query failure separately from a valid empty result (`null` versus `[]`) and return a non-success export response when required data failed to load. Full-Liturgy/Section-Item reads comply; Formula, Prayer, and Song catalog readers remain a tracked production-hardening gap.
- Graceful empty fallback is allowed only on non-artifact surfaces where failure and empty state are intentionally equivalent, such as a recent-items preview.

---

## Testing

- Extract decision logic into pure helpers when it can be tested without framework or database setup.
- Add focused regression tests for authorization branching, picked-entry change detection, render preparation, ordering contracts, and previously reproduced failures.
- Test the behavior boundary, not private implementation detail.

---

## React Effects and Refreshes

- Treat object and array props as identity-unstable after `router.refresh()`. An Effect must not reset local edit/form state merely because a refreshed Server Component produced an equivalent new reference.
- Depend on stable scalar keys or compare the specific fields that govern the Effect. Keep refresh-triggered synchronization separate from user-triggered reset behavior.

---

## Analytics Events

None — no analytics in v1, per project-overview.md.

---

## Environment Variables

| Variable | Used In |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Service-role and signed-in-user Supabase clients |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `lib/auth/supabaseServer.ts`, `lib/auth/supabaseBrowser.ts`, and `middleware.ts` — signed-in-user sessions |
| `SUPABASE_SERVICE_ROLE_KEY` | `lib/db/supabase.ts` — server-side only, never exposed to the client |

All three values are required. `npm run dev` and `npm run build` call
`scripts/check-env.mjs` first so a missing value produces a clear setup message
instead of a Supabase module-load failure. The anon key is public by design;
the service-role key is not and must never reach a browser bundle, log, commit,
fixture, or chat.

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
- `@react-pdf/renderer` — frozen Morning PDF compatibility generation
- `docx` — active `.docx` generation for both templates and audiences
- `tailwindcss` (v4) — styling
- `@tabler/icons-react` — shared icon source behind `components/liturgy/icons.tsx`
- `@supabase/ssr` — cookie-backed Curator/Compiler sessions for Server Components, Server Actions, and middleware; distinct from the server-only privileged application client
- `@vercel/speed-insights` — optional performance telemetry on the Vercel Hobby allowance; it never gates an application feature
- `supabase` (development) — free local Supabase CLI used to replay migrations against a disposable database
- `vitest` (development) — focused unit and regression tests

Do not install any other packages without updating this list first.

---

## Shared Helpers Over Per-Surface Reimplementation

This project renders the same compiled Liturgy content across Compile View, DOCX, the frozen PDF, and Web View. When a rendering rule is shared by two or more surfaces, put it in `lib/liturgy/` or `lib/text/` and call it from each surface. Established helpers include `resolveItemText.ts`, `sectionTitle.ts`, `applyMarks()`, `prepareSectionRender.ts`, and `resolveVerbalCueTemplate.ts`. Where a platform cannot share the component layer, share the pure decision helper and test each adapter against it.

## Icon Components

Shared icon exports live in `components/liturgy/icons.tsx` and are backed by Tabler icons with the project's common props and weight. Add missing icons to that wrapper rather than importing or hand-rolling them at individual call sites.

## Deployment (Vercel)

The Vercel project is connected to this repo's `main` branch and auto-deploys on push. Deployment requirements and diagnostics:

- **All three environment variables above must be set in Vercel's Project Settings → Environment Variables** before the first build; missing them fails the pre-build environment check.
- **If a deployment looks stale after a fix**, check its **Source** commit SHA. Vercel redeploys the selected deployment's commit, which may not be the latest push. Push a new commit when a deployment must target the current `main` HEAD.
- **Every page that reads library/liturgy data from Supabase and can be revisited after a save must export `export const dynamic = "force-dynamic"`.** Without it, `router.refresh()` can receive a cached response after a successful save and present stale data. Check this explicitly on every new asynchronous page that reads mutable project data.
