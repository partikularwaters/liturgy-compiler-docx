// Track B (2026-08-31): Prayer audience (Corporate vs Leader/Guide-only)
// moved from a Library-level property (Prayer.kind, now removed) to a
// per-placement fact (PrayerItem.leaderOnly, snapshotted at placement time
// from this default and independently changeable afterward per placement --
// the same Prayer placed in two different Sections can now genuinely have
// two different audience states). This policy supplies only the *default*
// a new placement starts from; same shape as amenPolicy.ts's per-Section
// lookup.
export type PrayerKindDefault = "corporate" | "leader";

const PRAYER_KIND_DEFAULT: Record<string, PrayerKindDefault> = {
  "Confession of Sin": "corporate",
};

export function getDefaultPrayerKind(sectionName: string): PrayerKindDefault {
  return PRAYER_KIND_DEFAULT[sectionName] ?? "leader";
}
