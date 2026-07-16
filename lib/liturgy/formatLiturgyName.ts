import { isSunday, parseLocalDate } from "@/lib/liturgy/lordsDay";
import type { LiturgySummary } from "@/types/liturgy";

function formatDateDisplay(serviceDate: string): string {
  const [year, month, day] = serviceDate.split("-");
  return `${month}-${day}-${year}`;
}

// "Lord's Day # | Worship Type | Sermon Text | Date" — the Lord's Day segment
// is omitted entirely (not computed-then-hidden) when the service date isn't
// a Sunday, and the Sermon segment is omitted when no Sermon passage has been
// added yet. redesign-plan-v1.1.md §D.
export function formatLiturgyName(summary: LiturgySummary): string {
  const parts: string[] = [];

  if (isSunday(parseLocalDate(summary.serviceDate))) {
    parts.push(`Lord's Day ${summary.lordsDayNumber}`);
  }

  parts.push(summary.templateName);

  if (summary.sermonPassage) {
    parts.push(summary.sermonPassage);
  }

  parts.push(formatDateDisplay(summary.serviceDate));

  return parts.join(" | ");
}
