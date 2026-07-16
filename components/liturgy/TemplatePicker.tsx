import type { LiturgyTemplate, LiturgyTemplateId } from "@/types/liturgy";

interface TemplatePickerProps {
  templates: LiturgyTemplate[];
  selectedId: LiturgyTemplateId;
  onSelect: (id: LiturgyTemplateId) => void;
}

export default function TemplatePicker({
  templates,
  selectedId,
  onSelect,
}: TemplatePickerProps): React.ReactElement {
  return (
    <div className="flex gap-4">
      {templates.map((template) => {
        const isSelected = template.id === selectedId;
        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template.id)}
            className={`flex-1 text-left bg-surface rounded-lg p-6 shadow-[0px_1px_3px_rgba(34,32,28,0.08)] ${
              isSelected ? "border-2 border-accent" : "border border-border"
            }`}
          >
            <span
              className={`text-[18px] font-semibold leading-[26px] ${
                isSelected ? "text-accent-dark" : "text-text-primary"
              }`}
            >
              {template.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
