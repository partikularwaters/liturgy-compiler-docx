import { getChapter } from "@/lib/bible";
import { parseCitationReference } from "@/lib/bible/bookNamesTagalog";
import { computeContextWindow } from "@/lib/bible/contextWindow";

// BSB-only expanded-context hover preview -- AB1905 citations keep linking
// out to BibleGateway's AB2001 (a genuine cross-translation check against a
// newer Filipino translation we don't self-host), but a BSB citation is
// already showing the same self-hosted text a widget would preview, so the
// useful thing to show instead is more of it: a window of surrounding
// verses from our own data, no external service involved.
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const citation = url.searchParams.get("citation");
  if (!citation) {
    return Response.json({ error: "citation is required" }, { status: 400 });
  }

  const parsed = parseCitationReference(citation);
  if (!parsed) {
    return Response.json({ error: "Unable to parse this citation." }, { status: 400 });
  }

  const chapterData = await getChapter("BSB", parsed.book, parsed.chapter);
  if (chapterData.verses.length === 0) {
    return Response.json({ error: "Chapter not found." }, { status: 404 });
  }

  const { start, end } = computeContextWindow(parsed.verses, chapterData.verses.length);
  const verses = chapterData.verses.filter((v) => v.number >= start && v.number <= end);

  return Response.json({
    book: parsed.book,
    chapter: parsed.chapter,
    verses,
    // The citation's own verses, distinct from the padded window above --
    // lets the client briefly highlight which verses are actually the
    // reference, versus the surrounding context added around them.
    referencedVerses: parsed.verses,
  });
}
