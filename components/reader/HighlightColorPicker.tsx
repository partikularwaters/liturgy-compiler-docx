import type { HighlightColor } from "@/types/bible";

interface HighlightColorPickerProps {
  activeColor: HighlightColor | null;
  onSelect: (color: HighlightColor | null) => void;
}

const colorOptions: { color: HighlightColor; swatchClass: string; label: string }[] = [
  { color: "accent", swatchClass: "bg-accent", label: "Burgundy" },
  { color: "success", swatchClass: "bg-success", label: "Green" },
  { color: "info", swatchClass: "bg-info", label: "Blue" },
  { color: "warning", swatchClass: "bg-warning", label: "Amber" },
];

export default function HighlightColorPicker({
  activeColor,
  onSelect,
}: HighlightColorPickerProps): React.ReactElement {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[13px] font-medium leading-[18px] text-text-secondary">Highlight</span>
      {colorOptions.map(({ color, swatchClass, label }) => (
        <button
          key={color}
          type="button"
          aria-label={label}
          onClick={() => onSelect(activeColor === color ? null : color)}
          className={`w-6 h-6 rounded-full ${swatchClass} ${
            activeColor === color ? "ring-2 ring-offset-2 ring-text-primary" : ""
          }`}
        />
      ))}
    </div>
  );
}
