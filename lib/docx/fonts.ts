// Unlike @react-pdf/renderer (lib/pdf/fonts.ts), the `docx` library never
// loads font files -- a Word document only *references* a font by name in
// its XML; Word itself resolves and renders the glyphs using whatever's
// installed on the machine that opens the file. No Font.register()
// equivalent exists or is needed. Ibarra
// Real Nova is confirmed already installed wherever these .docx files get opened, so
// no fallback-font handling is built here.
export const DOCX_FONT_FAMILY = "Ibarra Real Nova";
