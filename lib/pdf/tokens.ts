// @react-pdf/renderer renders outside the DOM/CSS pipeline entirely — it has
// no access to Tailwind classes or the CSS variables in app/globals.css, so
// this is the one deliberate, necessary exception to ui-rules.md's "never
// hardcode hex" rule. Values mirror ui-tokens.md's @theme block exactly;
// update both together if a token changes.
export const pdfColors = {
  background: "#F7F6F2",
  surface: "#FFFFFF",
  border: "#E3DFD5",
  textPrimary: "#22201C",
  textSecondary: "#6B6558",
  textMuted: "#A39C8C",
  accentLight: "#F3E3E5",
  accentDark: "#5C1F27",
};
