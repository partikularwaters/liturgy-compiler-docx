// The `docx` library builds a Word document's XML directly -- like
// lib/pdf/tokens.ts, it has no access to Tailwind classes or the CSS
// variables in app/globals.css, so this is the same deliberate, necessary
// exception to ui-rules.md's "never hardcode hex" rule. Values mirror
// ui-tokens.md's @theme block exactly (same source lib/pdf/tokens.ts uses);
// update both together if a token changes. docx wants 6-hex-digit RRGGBB
// with no leading "#", unlike CSS/react-pdf's "#RRGGBB".
export const docxColors = {
  background: "F7F6F2",
  surface: "FFFFFF",
  surfaceSecondary: "F1EFE9",
  border: "E3DFD5",
  textPrimary: "22201C",
  textSecondary: "6B6558",
  textMuted: "A39C8C",
  accentLight: "F3E3E5",
  accentDark: "5C1F27",
  citation: "C00000",
};
