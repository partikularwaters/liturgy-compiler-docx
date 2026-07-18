import path from "node:path";
import { Font } from "@react-pdf/renderer";

// react-pdf renders server-side, outside the browser — it can't use
// next/font/google like the rest of the app. These are the same two font
// families from ui-rules.md's Fonts section, loaded from real .ttf files
// (public/fonts/) via Font.register instead.
const fontsDir = path.join(process.cwd(), "public", "fonts");

let registered = false;

export function registerPdfFonts(): void {
  if (registered) return;
  registered = true;

  Font.register({
    family: "Old Standard TT",
    fonts: [
      { src: path.join(fontsDir, "OldStandardTT-Regular.ttf"), fontWeight: "normal" },
      { src: path.join(fontsDir, "OldStandardTT-Bold.ttf"), fontWeight: "bold" },
    ],
  });

  Font.register({
    family: "Ibarra Real Nova",
    fonts: [
      { src: path.join(fontsDir, "IbarraRealNova-Regular.ttf"), fontWeight: "normal" },
      { src: path.join(fontsDir, "IbarraRealNova-Bold.ttf"), fontWeight: "bold" },
      // Sourced 2026-07-18 the same way as the original two (Google's
      // css2 API, forced to a static instance) -- this pass only got woff
      // back, not ttf, so these register as woff. fontkit (react-pdf's
      // underlying parser) supports woff; if that ever stops being true,
      // Song titles/rubric text fall back to upright, same documented
      // degradation this project has always had for italic in the PDF.
      {
        src: path.join(fontsDir, "IbarraRealNova-Italic.woff"),
        fontWeight: "normal",
        fontStyle: "italic",
      },
      {
        src: path.join(fontsDir, "IbarraRealNova-BoldItalic.woff"),
        fontWeight: "bold",
        fontStyle: "italic",
      },
    ],
  });
}
