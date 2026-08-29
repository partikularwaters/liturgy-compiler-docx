import { isSunday, parseLocalDate } from "@/lib/liturgy/lordsDay";

function formatDateLong(serviceDate: string): string {
  const [year, month, day] = serviceDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export interface LiturgyOccasionParts {
  serviceDateLabel: string;
  occasionLabel: string;
}

export function getLiturgyOccasionParts(
  serviceDate: string,
  lordsDayNumber: number | null
): LiturgyOccasionParts {
  return {
    serviceDateLabel: formatDateLong(serviceDate),
    occasionLabel: isSunday(parseLocalDate(serviceDate)) ? `Lord’s Day #${lordsDayNumber}` : "Special Service",
  };
}

// "Date | Lord's Day #N" for a Sunday, "Date | Special Service" otherwise --
// used wherever a liturgy needs a full human-readable identity line (the
// delete confirmation dialog), distinct from formatLiturgyName.ts's
// pipe-joined summary line which omits the Lord's Day segment entirely
// rather than substituting a label. "Special Service" is the agreed term
// for a non-Sunday liturgy (2026-08-28) -- architecture.md's invariant that
// a non-Sunday service_date never displays a Lord's Day number still holds,
// this is what replaces it, not an exception to it.
export function liturgyOccasionLabel(serviceDate: string, lordsDayNumber: number | null): string {
  const { serviceDateLabel, occasionLabel } = getLiturgyOccasionParts(serviceDate, lordsDayNumber);
  return `${serviceDateLabel} | ${occasionLabel}`;
}
