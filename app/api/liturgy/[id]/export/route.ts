import { createElement } from "react";
import { renderToStream } from "@react-pdf/renderer";
import { Packer } from "docx";
import { getLiturgy } from "@/lib/liturgy/getLiturgy";
import { getFormulas } from "@/lib/formulas/getFormulas";
import { getPrayers } from "@/lib/prayers/getPrayers";
import { getSongs } from "@/lib/songs/getSongs";
import { LiturgyDocument } from "@/lib/pdf/LiturgyDocument";
import { buildLiturgyDocx } from "@/lib/docx/LiturgyDocx";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// DOCX is the active export. The frozen PDF path is buried compatibility
// behavior and must be requested explicitly with `format=pdf`; an omitted or
// unknown format therefore resolves to DOCX.
export async function GET(request: Request, { params }: RouteParams): Promise<Response> {
  const { id } = await params;
  const url = new URL(request.url);
  const audience = url.searchParams.get("audience") === "bulletin" ? "bulletin" : "guide";
  const format = url.searchParams.get("format") === "pdf" ? "pdf" : "docx";

  // BA-004: fail closed on any unexpected error during document assembly
  // (a read that throws instead of returning an error object, a rendering
  // failure, etc.) rather than let it produce a truncated response the
  // client can't distinguish from a real, complete export.
  try {
    const [liturgy, formulas, prayers, songs] = await Promise.all([
      getLiturgy(id),
      getFormulas(),
      getPrayers(),
      getSongs(),
    ]);

    if (!liturgy) {
      return new Response("Liturgy not found, or its content could not be loaded. Please try again.", {
        status: 404,
      });
    }

    // Formula/Prayer/Song reads collapsing failure into an empty library was
    // the one remaining gap BA-004 didn't close -- an export built against a
    // library read that actually failed (not genuinely empty) would render
    // as a plausible, successful document missing real content, same failure
    // shape BA-004 fixed for section_items. `null` here means the read
    // failed; fail closed rather than generate a document from it.
    if (formulas === null || prayers === null || songs === null) {
      return new Response("Unable to load this liturgy's library content right now. Please try again.", {
        status: 502,
      });
    }

    const filenameBase = `${liturgy.templateName.replace(/\s+/g, "-")}-${liturgy.serviceDate}-${audience}`;

    if (format === "docx") {
      const document = buildLiturgyDocx({ liturgy, formulas, prayers, songs, audience });
      const buffer = await Packer.toBuffer(document);

      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${filenameBase}.docx"`,
        },
      });
    }

    const document = createElement(LiturgyDocument, { liturgy, formulas, prayers, songs, audience });
    const stream = await renderToStream(document as Parameters<typeof renderToStream>[0]);

    return new Response(stream as unknown as ReadableStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filenameBase}.pdf"`,
      },
    });
  } catch (error) {
    console.error("[app/api/liturgy/[id]/export]", error);
    return new Response("Unable to generate this export right now. Please try again.", { status: 500 });
  }
}
