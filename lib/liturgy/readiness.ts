import type { CompiledLiturgy, Item } from "@/types/liturgy";

export type CompletionClass = "required" | "optional" | "structural";

export interface CompletionRule {
  class: CompletionClass;
  // A Section with more than one type requires every listed type to be
  // present before it has real content.
  requiredItemTypes?: Item["type"][];
}

export const MORNING_COMPLETION: Record<string, CompletionRule> = {
  "Call to Worship": { class: "required", requiredItemTypes: ["selection"] },
  "Prayer of Invocation": { class: "required", requiredItemTypes: ["selection"] },
  "Psalm of Adoration": { class: "required", requiredItemTypes: ["song"] },
  "Righteousness of God": { class: "required", requiredItemTypes: ["selection"] },
  "Call to Confession": { class: "required", requiredItemTypes: ["selection"] },
  "Confession of Sin": { class: "required", requiredItemTypes: ["selection"] },
  "Hymn of Propitiation": { class: "required", requiredItemTypes: ["song"] },
  "Assurance of Pardon": { class: "required", requiredItemTypes: ["selection", "formula"] },
  "Prayer for Illumination": { class: "optional" },
  "Psalm of Proclamation": { class: "required", requiredItemTypes: ["song"] },
  Sermon: { class: "required", requiredItemTypes: ["sermon"] },
  "Hymn of Dedication": { class: "required", requiredItemTypes: ["song"] },
  "Affirmation of Faith": { class: "required", requiredItemTypes: ["formula"] },
  "Offertory Call": { class: "required", requiredItemTypes: ["selection"] },
  "Psalm of Thanksgiving": { class: "required", requiredItemTypes: ["song"] },
  "Pastoral Prayer": { class: "optional" },
  Charge: { class: "optional" },
  Benediction: { class: "required", requiredItemTypes: ["selection"] },
  Doxology: { class: "required", requiredItemTypes: ["song"] },
};

export const VESPER_COMPLETION: Record<string, CompletionRule> = {
  "Call to Worship": { class: "required", requiredItemTypes: ["selection"] },
  "Prayer of Invocation": { class: "required", requiredItemTypes: ["selection"] },
  "Psalm of Adoration": { class: "required", requiredItemTypes: ["song"] },
  "Confession of Sin": { class: "required", requiredItemTypes: ["selection"] },
  "Prayer for Pardon": { class: "optional" },
  "Words of Thanksgiving": { class: "required", requiredItemTypes: ["selection"] },
  "Psalm of Proclamation": { class: "required", requiredItemTypes: ["song"] },
  "The Lord’s Discourses": { class: "required", requiredItemTypes: ["selection"] },
  "Words of Institution": { class: "required", requiredItemTypes: ["selection"] },
  "Prayer before Communion": { class: "optional" },
  "Hymn of Communion": { class: "required", requiredItemTypes: ["song"] },
  "The Lord’s Table": { class: "structural" },
  "Closing of the Table": { class: "required", requiredItemTypes: ["selection"] },
  "Affirmation of Faith": { class: "required", requiredItemTypes: ["formula"] },
  "Offertory & Thanksgiving": { class: "required", requiredItemTypes: ["selection", "song"] },
  "Prayer Meeting": { class: "structural" },
  "The Great Commission": { class: "required", requiredItemTypes: ["selection"] },
  Benediction: { class: "required", requiredItemTypes: ["selection"] },
  Doxology: { class: "required", requiredItemTypes: ["song"] },
};

export interface SectionProgress {
  name: string;
  class: CompletionClass;
  complete: boolean;
}

export interface LiturgyProgress {
  completed: number;
  total: number;
  missing: string[];
  sections: SectionProgress[];
}

function completionRules(templateName: string): Record<string, CompletionRule> {
  if (templateName === "Morning Worship") return MORNING_COMPLETION;
  if (templateName === "Vesper Worship") return VESPER_COMPLETION;
  return {};
}

export function computeProgress(liturgy: CompiledLiturgy): LiturgyProgress {
  const rules = completionRules(liturgy.templateName);
  const sections = liturgy.sections.map((section) => {
    const rule = rules[section.name] ?? { class: "optional" as const };
    const complete =
      rule.class === "structural" ||
      (rule.requiredItemTypes?.every((itemType) => section.items.some((item) => item.type === itemType)) ?? true);

    return { name: section.name, class: rule.class, complete };
  });
  const requiredSections = sections.filter((section) => section.class === "required");

  return {
    completed: requiredSections.filter((section) => section.complete).length,
    total: requiredSections.length,
    missing: requiredSections.filter((section) => !section.complete).map((section) => section.name),
    sections,
  };
}
