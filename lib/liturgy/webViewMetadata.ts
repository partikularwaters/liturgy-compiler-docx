import { isSunday, parseLocalDate } from "@/lib/liturgy/lordsDay";
import type { CompiledLiturgy } from "@/types/liturgy";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Parses "YYYY-MM-DD" directly rather than through a Date object's local
// timezone -- the same class of off-by-one bug already hit and fixed in the
// n8n automation's own date formatting (see the personal learning journal).
export function formatServiceDateDisplay(serviceDate: string): string {
  const [year, month, day] = serviceDate.split("-").map(Number);
  return `${MONTH_NAMES[month - 1]} ${day}, ${year}`;
}

// The church name, shown as the Web View's Open Graph site name -- on
// platforms like Facebook this replaces the auto-generated domain caption
// (e.g. "liturgy-compiler-three.vercel.app") with this instead.
export const WEB_VIEW_SITE_NAME = "Reformed Life Community Church";

export function buildWebViewTitle(liturgy: Pick<CompiledLiturgy, "templateName">): string {
  return `The Order for the ${liturgy.templateName} Service`;
}

// Omits "Lord's Day #" for a non-Sunday service date, matching
// formatLiturgyName.ts's same gating rule.
export function buildWebViewDescription(liturgy: Pick<CompiledLiturgy, "serviceDate" | "lordsDayNumber">): string {
  const dateDisplay = formatServiceDateDisplay(liturgy.serviceDate);
  return isSunday(parseLocalDate(liturgy.serviceDate))
    ? `${dateDisplay} | Lord's Day #${liturgy.lordsDayNumber}`
    : dateDisplay;
}
