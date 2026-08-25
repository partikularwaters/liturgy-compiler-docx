<!-- Library docs: key usage patterns for the libraries in this project -->

# Library Docs

Project-specific usage patterns for every third party library in this project. This file only covers how we use each library in this specific project — rules, patterns, and constraints specific to this codebase.

Read the relevant section before implementing any feature that touches these libraries.

---

## Before Using Any Library

Before implementing any feature that uses a third party library:

1. **Check AGENTS.md through the root CLAUDE.md shim** — it defines the project protocol and installed skills.
2. **Check if an MCP server is configured** for that library. If one is available — use it before falling back to general knowledge.
3. **Read this file** for project-specific patterns that override general library knowledge.

The order of authority is:

```
MCP server (real-time docs) → Skills → This file (project rules) → General training knowledge
```

Never rely on general training knowledge alone for library APIs — they change frequently and training data may be outdated.

---

## Supabase (Database Client)

Primary data store — Liturgies, Sections, row-based Section Items, reusable
libraries, Auth roles, and notifications.

### Usage Pattern 1 — Two clients with different authority

```typescript
// lib/db/supabase.ts — the server-only service-role client
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

`lib/db/supabase.ts` is the server-only service-role client. It bypasses RLS,
so every client-reachable mutation using it must perform its own authorization
check before writing.

`lib/auth/supabaseServer.ts` and `lib/auth/supabaseBrowser.ts` carry the signed-in
user's session using the public anon key. They exist for Auth and RLS-aware user
context; they never receive the service-role key.

**Rules:**

- Never import the service-role client into a Client Component
- Never assume RLS protects a service-role write
- Every client-reachable application mutation using the service-role client calls `getCurrentUser()` and completes its role/ownership check before the first application-data read or write. Authentication bootstrap actions are the only exception.
- Keep internal privileged helpers server-only. A Client Component calls a purpose-built Server Action, never a privileged query helper.
- Public reads remain available without login; authenticated authority is required for mutations

---

### Usage Pattern 2 — Queries

```typescript
import { insertSectionItem } from '@/lib/liturgy/sectionItems';

// Read
const { data, error } = await supabase
  .from('liturgies')
  .select('*, sections(*)')
  .eq('id', liturgyId)
  .single();

// Item writes go through lib/liturgy/sectionItems.ts rather than being issued
// ad hoc from a component or feature action.
const result = await insertSectionItem(sectionId, item);
```

**Rules:**

- Always handle the error return — never assume success
- Use `.single()` when expecting exactly one row
- Section Items live as individual `section_items` rows. Read and write them only through `lib/liturgy/sectionItems.ts`, which converts storage rows to the shared `Item` type.
- Preserve failure separately from emptiness on artifact-producing reads: return `null` for a failed required query and `[]` for a valid empty collection. Section-Item/Liturgy readers follow this contract. Formula, Prayer, and Song library readers do not yet; that remaining export-hardening work is tracked as open.
- Omit `section_items.position` on insert. Its database trigger assigns the next value atomically per Section; do not reproduce `max + 1` in application code.

---

## `docx` (Word Generation)

This is the active Leader Guide and Congregation Bulletin generator for both Morning and Vesper. `lib/docx/LiturgyDocx.ts` owns one document implementation parameterized by `audience`; do not fork separate Guide and Bulletin templates.

**Rules:**

- Resolve Item text and Section layout through the shared `lib/liturgy` helpers before creating Word nodes.
- Use Word's continuous multi-column flow. A Section's `column_break_before` is an explicit authoring override, not a computed pagination result.
- Generate files on demand and stream/download them directly; never persist generated artifacts.
- Keep the export route unified: `format=docx` is the default, `audience=guide|bulletin` selects visibility, and `format=pdf` is legacy compatibility only.
- Treat missing or failed required reads as an export failure, not as an empty document. This is the target contract; reusable Formula/Prayer/Song catalog failures can still arrive as empty arrays and remain open for correction.

---

## @react-pdf/renderer (Legacy PDF Generation)

The PDF renderer is buried cold and unlinked from the UI. It is reached only through explicit `format=pdf` and carries no supported present-tense product contract. Direct all artifact work to `docx`. PDF tokens remain literal hex in `lib/pdf/tokens.ts` because react-pdf cannot consume CSS variables.

**Italic weights, sourced 2026-07-18 the same way, with a wrinkle:** requesting Ibarra Real Nova's italic weights from the same css2 API (`family=Ibarra+Real+Nova:ital,wght@1,400;1,700`, old-Android user agent) returned `.woff`, not `.ttf` this time — Google's static-instancing/format negotiation isn't perfectly deterministic across requests. **`Font.register` accepts `.woff` directly** (fontkit, react-pdf's underlying parser, supports it) — no conversion needed, just register the `.woff` path like any other font file. Confirmed real embedding (not silent fallback) the same way as the original two weights: grep the exported PDF's raw bytes for `BaseFont` entries.

**Small-caps has no react-pdf equivalent at all** (no `font-variant` support without literal small-caps glyphs in the font) — the established substitute throughout this codebase is `textTransform: "uppercase"`, applied wherever the CSS side uses `[font-variant:small-caps]`. This is a real, permanent platform gap, not a temporary workaround — don't attempt `fontVariant` in a react-pdf `StyleSheet`, it silently does nothing.

**A real react-pdf layout gotcha, 2026-07-18:** every `<View>` is block-level (flex-column) by default. Wrapping each item in a segment-rendering loop in its own `<View>` — the original approach for the Leader/Congregation/Minister/Small-Caps marking loop — forces a line break around *every* segment, including ones that should flow inline (plain text, Small Caps). Only wrap a segment in its own `<View>` when it's genuinely meant to be its own block (Congregation/Minister); group everything else into one shared `<Text>` with nested `<Text>` children for per-run styling (bold, small-caps-substitute) — nested `<Text>` flows inline in react-pdf the same way `parseBoldSegments`' bold runs already did, `<View>` never does.

### Usage Pattern 1 — Shared Document, Filtered by Visibility

```typescript
// lib/pdf/LiturgyDocument.tsx
import { Document, Page, Text, View } from '@react-pdf/renderer';

export function LiturgyDocument({ liturgy, audience }: { liturgy: Liturgy; audience: 'guide' | 'bulletin' }) {
  const visibleItems = (items: Item[]) =>
    audience === 'guide' ? items : items.filter(i => i.visibility !== 'leader_only');

  return (
    <Document>
      <Page size="A4">
        {liturgy.sections.map(section => (
          <View key={section.id}>
            <Text>{section.name}</Text>
            {visibleItems(section.items).map(item => <Text key={item.id}>{item.text}</Text>)}
          </View>
        ))}
      </Page>
    </Document>
  );
}
```

**Rules:**

- One Document component, one `audience` prop — never fork into two separate PDF templates that could drift apart
- Generated on demand — never persisted to storage (per architecture.md)

---

### Usage Pattern 2 — Serving the PDF

```typescript
// app/api/liturgy/[id]/export/route.ts
// Route handler files must stay .ts (not .tsx) — JSX syntax doesn't parse
// there, so the Document element is built with createElement instead.
import { createElement } from 'react';
import { renderToStream } from '@react-pdf/renderer';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const audience = new URL(request.url).searchParams.get('audience') === 'bulletin' ? 'bulletin' : 'guide';
  const liturgy = await getLiturgy(id);
  const document = createElement(LiturgyDocument, { liturgy, formulas, prayers, audience });
  const stream = await renderToStream(document as Parameters<typeof renderToStream>[0]);
  return new Response(stream as unknown as ReadableStream, {
    headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="..."` },
  });
}
```

One route, one `?audience=guide|bulletin` query param — not two separate route files — matching the "one Document, one audience prop" principle at the route level too.

**Rules:**

- This is the one deliberate exception to the Server-Actions-only rule in code-standards.md — file streaming needs a real HTTP response, which Server Actions don't provide
- `renderToStream`'s TypeScript signature strictly expects `ReactElement<DocumentProps>`, which a wrapper component's return type doesn't structurally satisfy even though it renders a `<Document>` at runtime — cast via `as Parameters<typeof renderToStream>[0]` rather than fighting the type

---

## Bible Text Providers (AB1905 + BSB)

The two full-text sources behind `lib/bible`'s abstraction, powering the Reader.

**Decided and shipped since Feature 02:** both self-hosted as rows in a `bible_verses` table (translation, book, chapter, verse, text), seeded once from their public-domain source files (Ang Dating Biblia XML from `seven1m/open-bibles`; BSB text from berean.bible) rather than calling a live third-party API on every page load. Both are public domain, so there's no licensing reason not to store them permanently, and self-hosting means the Reader never depends on an external API's uptime or rate limits.

```typescript
// lib/bible/index.ts
export async function getChapter(translation: 'AB1905' | 'BSB', book: string, chapter: number) {
  const { data, error } = await supabase
    .from('bible_verses')
    .select('verse, text')
    .eq('translation', translation)
    .eq('book', book)
    .eq('chapter', chapter)
    .order('verse');
  if (error) throw error;
  return data;
}
```

**Rules:**

- This is the only function in the codebase that queries `bible_verses` directly
- AB2001/MBB never appear in this file or this table — see the widget pattern below

---

## BibleGateway RefTag/BGLinks Widget (AB2001/MBB Hover Preview)

BibleGateway BGLinks provides licensed, display-only AB2001 hover text; the application stores none of it. `components/layout/ScriptureLinker.tsx` loads the script once and reruns `linkVerses()` after client-side route changes. The widget scans visible citation text and skips content it has already linked. `window.BGLinks.version` is global rather than per citation, so AB2001 is the fixed default and no AB2001/MBB switcher is provided.

### Usage Pattern 1 — Script Injection

```typescript
// components/liturgy/ScriptureReference.tsx
useEffect(() => {
  const script = document.createElement('script');
  script.src = 'https://www.biblegateway.com/public/link-to-us/tooltips/bglinks.js';
  script.async = true;
  document.body.appendChild(script);
  return () => { document.body.removeChild(script); };
}, []);
```

```typescript
// Per-reference version selection
window.BGLinks.version = 'ABTAG2001'; // or 'MBBTAG'
window.BGLinks.linkVerses();
```

**Rules:**

- This widget is the only permitted source of AB2001/MBB text anywhere in the app — never fetch or store this text elsewhere (see architecture.md's invariants)
- Re-run `BGLinks.linkVerses()` after any client-side navigation, since the script only scans the DOM once on load
