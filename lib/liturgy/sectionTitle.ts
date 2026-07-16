import type { TemplateSection } from "@/types/liturgy";

// Shared by the Compile View and the PDF export so the displayed Section
// title (dynamic Psalm/Hymn naming, posture asterisk) can't drift between them.
export function sectionTitle(section: TemplateSection): string {
  const label = section.dynamic_naming
    ? section.name.replace(/^(Psalm|Hymn)\b/, "Psalm/Hymn")
    : section.name;
  return section.posture === "standing" ? `${label}*` : label;
}
