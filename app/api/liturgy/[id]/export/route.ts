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

// v2 item 1: docx export, added alongside the existing PDF branch --
// ?format=docx|pdf, mirroring the established "one route, one param" shape
// this file already used for ?audience=guide|bulletin (library-docs.md).
// PDF stays the default (format param omitted) since it's still the
// working, unremoved export path -- lib/pdf/ is frozen, not deleted, until
// docx is proven stable (see build-plan.md's v2 item 1 scoping note).
export async function GET(request: Request, { params }: RouteParams): Promise<Response> {
  const { id } = await params;
  const url = new URL(request.url);
  const audience = url.searchParams.get("audience") === "bulletin" ? "bulletin" : "guide";
  const format = url.searchParams.get("format") === "docx" ? "docx" : "pdf";

  const [liturgy, formulas, prayers, songs] = await Promise.all([
    getLiturgy(id),
    getFormulas(),
    getPrayers(),
    getSongs(),
  ]);

  if (!liturgy) {
    return new Response("Liturgy not found.", { status: 404 });
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
}
