import { ImageResponse } from "next/og";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getLiturgy } from "@/lib/liturgy/getLiturgy";
import { buildWebViewDescription, buildWebViewTitle, WEB_VIEW_SITE_NAME } from "@/lib/liturgy/webViewMetadata";

// fs.readFile needs the Node.js runtime -- the default Edge runtime for
// this special-file convention can't read local files the way react-pdf's
// font loading already relies on elsewhere in this codebase.
export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface OpengraphImageProps {
  params: Promise<{ id: string }>;
}

export default async function OpengraphImage({ params }: OpengraphImageProps): Promise<ImageResponse> {
  const { id } = await params;
  const liturgy = await getLiturgy(id);

  const fontsDir = path.join(process.cwd(), "public", "fonts");
  const [ibarraRegular, interRegular, interSemiBold] = await Promise.all([
    fs.readFile(path.join(fontsDir, "IbarraRealNova-Regular.ttf")),
    fs.readFile(path.join(fontsDir, "Inter-Regular.woff")),
    fs.readFile(path.join(fontsDir, "Inter-SemiBold.woff")),
  ]);

  // Satori (this route's renderer) doesn't support real OpenType small
  // caps (`font-variant: small-caps`) the way a browser does -- faked here
  // with uppercase text plus generous letter-spacing instead, the same
  // documented-degradation pattern this codebase already uses for the
  // PDF's italic fallback (see lib/pdf/fonts.ts).
  const title = liturgy ? buildWebViewTitle(liturgy).toUpperCase() : "LITURGY NOT FOUND";
  const description = liturgy ? buildWebViewDescription(liturgy) : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F7F6F2",
          padding: "80px",
        }}
      >
        <div
          style={{
            fontFamily: "Ibarra Real Nova",
            fontSize: 56,
            letterSpacing: 4,
            color: "#22201C",
            textAlign: "center",
            lineHeight: 1.3,
          }}
        >
          {title}
        </div>
        {description ? (
          <div
            style={{
              marginTop: 32,
              fontFamily: "Inter",
              fontWeight: 600,
              fontSize: 30,
              color: "#5C1F27",
              textAlign: "center",
            }}
          >
            {description}
          </div>
        ) : null}
        <div
          style={{
            marginTop: 40,
            fontFamily: "Inter",
            fontWeight: 400,
            fontSize: 22,
            letterSpacing: 2,
            color: "#A39C8C",
            textTransform: "uppercase",
            textAlign: "center",
          }}
        >
          {WEB_VIEW_SITE_NAME}
        </div>
      </div>
    ),
    {
      width: size.width,
      height: size.height,
      fonts: [
        { name: "Ibarra Real Nova", data: ibarraRegular, weight: 400, style: "normal" },
        { name: "Inter", data: interRegular, weight: 400, style: "normal" },
        { name: "Inter", data: interSemiBold, weight: 600, style: "normal" },
      ],
    }
  );
}
