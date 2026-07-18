import { createElement } from "react";
import { renderToStream } from "@react-pdf/renderer";
import { getLiturgy } from "@/lib/liturgy/getLiturgy";
import { getFormulas } from "@/lib/formulas/getFormulas";
import { getPrayers } from "@/lib/prayers/getPrayers";
import { getSongs } from "@/lib/songs/getSongs";
import { LiturgyDocument } from "@/lib/pdf/LiturgyDocument";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams): Promise<Response> {
  const { id } = await params;
  const audienceParam = new URL(request.url).searchParams.get("audience");
  const audience = audienceParam === "bulletin" ? "bulletin" : "guide";

  const [liturgy, formulas, prayers, songs] = await Promise.all([
    getLiturgy(id),
    getFormulas(),
    getPrayers(),
    getSongs(),
  ]);

  if (!liturgy) {
    return new Response("Liturgy not found.", { status: 404 });
  }

  const document = createElement(LiturgyDocument, { liturgy, formulas, prayers, songs, audience });
  const stream = await renderToStream(document as Parameters<typeof renderToStream>[0]);

  const filename = `${liturgy.templateName.replace(/\s+/g, "-")}-${liturgy.serviceDate}-${audience}.pdf`;

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
