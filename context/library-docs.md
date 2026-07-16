<!-- Library docs: key usage patterns for the libraries in this project -->

# Library Docs

Project-specific usage patterns for every third party library in this project. This file only covers how we use each library in this specific project — rules, patterns, and constraints specific to this codebase.

Read the relevant section before implementing any feature that touches these libraries.

---

## Before Using Any Library

Before implementing any feature that uses a third party library:

1. **Check CLAUDE.md** at the project root — it lists every skill installed for this project. Skills contain up-to-date API documentation and usage patterns specific to this codebase.
2. **Check if an MCP server is configured** for that library. If one is available — use it before falling back to general knowledge.
3. **Read this file** for project-specific patterns that override general library knowledge.

The order of authority is:

```
MCP server (real-time docs) → Skills → This file (project rules) → General training knowledge
```

Never rely on general training knowledge alone for library APIs — they change frequently and training data may be outdated.

---

## Supabase (Database Client)

Primary data store — Liturgies, Sections (with jsonb Items), Formulas, Prayers.

### Usage Pattern 1 — Server-Only Client

```typescript
// lib/db/supabase.ts — the only place Supabase is instantiated
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

**Rules:**

- Never import this client into a component — only into Server Actions and `lib/liturgy`, `lib/bible`
- No separate browser client in v1 — there's no client-side auth or realtime need yet

---

### Usage Pattern 2 — Queries

```typescript
// Read
const { data, error } = await supabase
  .from('liturgies')
  .select('*, sections(*)')
  .eq('id', liturgyId)
  .single();

// Write
const { data, error } = await supabase
  .from('sections')
  .update({ items: updatedItems })
  .eq('id', sectionId);
```

**Rules:**

- Always handle the error return — never assume success
- Use `.single()` when expecting exactly one row
- Items are read/written as a whole jsonb array per Section (see architecture.md) — don't attempt to patch a single Item without reading and rewriting the full array

---

## @react-pdf/renderer (PDF Generation)

Generates the Leader Guide and Congregation Bulletin from one compiled Liturgy. **Implemented 2026-07-14 (Phase 4, Features 11-12)** — `lib/pdf/LiturgyDocument.tsx` matches the pattern below closely, with three additions the original proposal didn't anticipate: (1) fonts are loaded from real `.ttf` files under `public/fonts/` via `lib/pdf/fonts.ts`'s `registerPdfFonts()`, since react-pdf renders outside the DOM/CSS pipeline and can't use `next/font/google` — Old Standard TT's static weights came straight from the `google/fonts` GitHub repo, but Ibarra Real Nova only ships as a variable font there, so its regular/bold statics were pulled from Google's font-serving CDN instead (`fonts.googleapis.com/css2?family=...` with an old-Android user agent to force a `.ttf` response instead of `.woff2`); (2) colors are literal hex in `lib/pdf/tokens.ts` (the one necessary exception to "never hardcode hex," since react-pdf has no Tailwind/CSS-variable access at all); (3) Item resolution (Formula override-vs-default, Prayer lookup, visibility) goes through `lib/liturgy/resolveItemText.ts` — the same function the Compile View's `SectionCard` uses — so the PDF can never silently drift from what's shown on screen.

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

**[UNDECIDED — proposed default below, needs your reaction]**

For how AB1905/BSB text is stored and served, I'd default to: **self-host both as rows in a `bible_verses` table** (translation, book, chapter, verse, text), seeded once from their public-domain source files (Ang Dating Biblia XML from ebible.org/open-bibles; BSB text from berean.bible) — rather than calling a live third-party API on every page load. Both are public domain, so there's no licensing reason not to store them permanently, and self-hosting means the Reader never depends on an external API's uptime or rate limits. Sound right?

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

Licensed, display-only hover preview for AB2001 and MBB — no text stored in this app. **Implemented 2026-07-14 (Phase 5, Feature 14).** Fetched and read the real `bglinks.js` source before building (rather than trusting this doc's proposed pattern blind) — confirmed accurate: it auto-scans visible page text itself for citation patterns (no per-reference markup needed; "Psalms 95:1-2" as plain text is enough) and skips already-wrapped/`<a>`/heading nodes on repeat scans. One real constraint the original proposal didn't call out: `window.BGLinks.version` is a single global, not per-citation — the widget can only show one translation at a time, not a live AB2001/MBB toggle. Asked Madrid; **AB2001 is the fixed default** in v1, no switcher built. `components/layout/ScriptureLinker.tsx` mounts once in `app/layout.tsx`, injects the script once, sets the version, and re-runs `linkVerses()` on every client-side route change (`usePathname()`) since Next's App Router doesn't full-reload between pages. Verified live: hovering a real citation renders BibleGateway's own tooltip with real AB2001 text fetched directly from their servers — confirmed via the DOM (`#bg_popup-container`'s content), never touching this app's Server Actions or database.

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
