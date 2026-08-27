import { ImageResponse } from "next/og";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getLiturgy } from "@/lib/liturgy/getLiturgy";
import { buildWebViewDescription, buildWebViewTitle, WEB_VIEW_SITE_NAME } from "@/lib/liturgy/webViewMetadata";

// A plain Route Handler, not Next's opengraph-image.tsx special-file
// convention -- that convention silently 404s specifically when nested as
// [dynamic-segment]/static-folder/opengraph-image.tsx (confirmed by
// isolating the exact failing shape locally: it works directly under a
// dynamic segment or at the app root, but not with an extra static folder
// like this route's real "view" segment in between). A manual Route
// Handler in the identical nesting shape works correctly, so this route is
// wired into generateMetadata's openGraph.images manually in page.tsx
// instead of relying on Next's automatic convention wiring.
export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext): Promise<ImageResponse> {
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
      width: 1200,
      height: 630,
      fonts: [
        { name: "Ibarra Real Nova", data: ibarraRegular, weight: 400, style: "normal" },
        { name: "Inter", data: interRegular, weight: 400, style: "normal" },
        { name: "Inter", data: interSemiBold, weight: 600, style: "normal" },
      ],
    }
  );
}
