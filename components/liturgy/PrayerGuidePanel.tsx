import type { Prayer } from "@/types/liturgy";

// Feature 27: read-only reference panel for 'guide'-kind Prayer library
// entries (redesign-plan-v1.1.md §W) -- shown next to "+ Prayer" on the six
// Sections that need one, never selectable/placeable as an actual liturgy
// item. Renders nothing when no guide exists yet for this Section, same
// "real gap, not a placeholder" discipline as everywhere else -- guides are
// optional reference material Madrid authors through /library, not seeded.
export default function PrayerGuidePanel({ guides }: { guides: Prayer[] }): React.ReactElement | null {
  if (guides.length === 0) return null;

  return (
    <div className="bg-surface-secondary border border-border rounded-md p-3 flex flex-col gap-2">
      <p className="text-[13px] font-medium text-text-secondary">Prayer Guide</p>
      {guides.map((guide) => (
        // 2026-07-21: guide text now carries a numbered structural sequence
        // (rubrics from the Handbook for Leading Worship) with real line
        // breaks -- whitespace-pre-line so those breaks actually render
        // instead of collapsing to a run-on line, without needing markdown
        // parsing for what's read-only reference text, never placed content.
        <p key={guide.id} className="text-sm text-text-primary whitespace-pre-line">
          {guide.text}
        </p>
      ))}
    </div>
  );
}
