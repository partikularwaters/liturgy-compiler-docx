import type { LiturgySummary } from "@/types/liturgy";

export interface LiturgyDateGroup {
  serviceDate: string;
  lordsDayNumber: number;
  morning: LiturgySummary[];
  vesper: LiturgySummary[];
}

// Pairs a Morning and Vesper liturgy on the same service_date into one row
// (Liturgies page redesign, matching Library's two-column pattern -- Lord's
// Day # sits in the middle where a matching bilingual pair's divider would
// be). getLiturgies() already orders by service_date descending; a Map
// preserves that insertion order, so this needs no re-sort of its own.
export function groupLiturgiesByDate(liturgies: LiturgySummary[]): LiturgyDateGroup[] {
  const groups = new Map<string, LiturgyDateGroup>();

  for (const liturgy of liturgies) {
    let group = groups.get(liturgy.serviceDate);
    if (!group) {
      group = { serviceDate: liturgy.serviceDate, lordsDayNumber: liturgy.lordsDayNumber, morning: [], vesper: [] };
      groups.set(liturgy.serviceDate, group);
    }
    if (liturgy.templateName === "Morning Worship") {
      group.morning.push(liturgy);
    } else if (liturgy.templateName === "Vesper Worship") {
      group.vesper.push(liturgy);
    }
  }

  return Array.from(groups.values());
}
