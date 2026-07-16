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

**[UNDECIDED — proposed default below, needs your reaction]**

For [decision: Server Actions vs. API routes], I'd default to: **Next.js Server Actions for all data mutations** (creating a Liturgy, saving an Item, editing a Formula) — this is an internal single-user tool with no public API surface to expose, so Server Actions avoid the extra boilerplate of a REST-shaped route for every mutation. **API routes reserved for cases needing raw HTTP semantics** — specifically, streaming the generated PDF back for download in Phase 4. Sound right?

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
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/` — Supabase client init |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `lib/` — Supabase client init (client-side reads) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Actions / API routes only — never exposed to the client |

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
- `@react-pdf/renderer` — PDF generation
- `tailwindcss` (v4) — styling

Do not install any other packages without updating this list first.
