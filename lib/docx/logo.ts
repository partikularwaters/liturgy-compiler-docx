import fs from "node:fs";
import path from "node:path";

// The church's real logo, supplied by Madrid (2026-07-22) as
// docs/Reformed Life Logo.png -- copied to public/images/ (same convention
// as public/fonts/ for react-pdf) so this module can read it from disk.
// docx (unlike react-pdf) needs no font-embedding equivalent, but an
// ImageRun still needs the actual raster bytes read in directly.
const LOGO_PATH = path.join(process.cwd(), "public", "images", "reformed-life-logo.png");

// Real pixel dimensions read from the PNG's own IHDR chunk (1427x320) --
// the aspect ratio a docx ImageRun's `transformation` must preserve so the
// logo doesn't render squashed/stretched.
const LOGO_NATIVE_WIDTH = 1427;
const LOGO_NATIVE_HEIGHT = 320;
const LOGO_ASPECT_RATIO = LOGO_NATIVE_WIDTH / LOGO_NATIVE_HEIGHT;

// ~2in wide, per redesign-plan-v1.1.md §AA's "church logo (~2in)" spec.
// docx's ImageRun transformation is in pixels at a fixed 96dpi convention,
// so 2in = 192px.
export const LOGO_WIDTH_PX = 192;
export const LOGO_HEIGHT_PX = Math.round(LOGO_WIDTH_PX / LOGO_ASPECT_RATIO);

let cachedLogoBuffer: Buffer | null = null;

export function getLogoBuffer(): Buffer | null {
  if (cachedLogoBuffer) return cachedLogoBuffer;
  try {
    cachedLogoBuffer = fs.readFileSync(LOGO_PATH);
    return cachedLogoBuffer;
  } catch {
    // Real gap, not silently wrong: if the logo file is ever missing (a
    // fresh checkout, a deploy that didn't include public/images/), the
    // masthead just omits it rather than crashing the export.
    console.error("[lib/docx/logo] reformed-life-logo.png not found at", LOGO_PATH);
    return null;
  }
}
