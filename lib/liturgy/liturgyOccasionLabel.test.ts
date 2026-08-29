import { describe, expect, it } from "vitest";
import { liturgyOccasionLabel } from "@/lib/liturgy/liturgyOccasionLabel";

describe("liturgyOccasionLabel", () => {
  it("shows the Lord's Day number for a Sunday service date", () => {
    // 2026-08-30 is a real Sunday.
    expect(liturgyOccasionLabel("2026-08-30", 35)).toBe("August 30, 2026 | Lord’s Day #35");
  });

  it("shows 'Special Service' for a non-Sunday date, never the Lord's Day number", () => {
    // 2026-08-22 is a real Saturday.
    expect(liturgyOccasionLabel("2026-08-22", 34)).toBe("August 22, 2026 | Special Service");
  });
});
