import { describe, expect, it } from "vitest";
import { getVesperTableReadings, VESPER_TABLE_SECTIONS, VESPER_GREAT_COMMISSION_OPTIONS } from "@/lib/liturgy/vesperTableRotation";

describe("getVesperTableReadings", () => {
  it("matches the real, live-confirmed 2026-08-30 assignment (a 5th Sunday, confirmed against a real Vesper liturgy created in Production)", () => {
    const readings = getVesperTableReadings("2026-08-30");

    expect(readings.discourse.title).toBe("The Mission Discourse");
    expect(readings.discourse.citation).toBe("Matthew 10:1–42");
    expect(readings.wordsOfInstitution).toBe("1 Corinthians 11:23–29");
    expect(readings.closingOfTable).toBe("Matthew 5:9–15");
    expect(readings.greatCommission).toBe("Acts 1:7–8");
  });
});

describe("VESPER_TABLE_SECTIONS", () => {
  it("includes The Great Commission alongside the other three auto-assigned readings", () => {
    expect(VESPER_TABLE_SECTIONS).toEqual([
      "The Lord's Discourses",
      "Words of Institution",
      "Closing of the Table",
      "The Great Commission",
    ]);
  });
});

describe("VESPER_GREAT_COMMISSION_OPTIONS", () => {
  it("matches the canonical 4-week cycle from the source document", () => {
    expect(VESPER_GREAT_COMMISSION_OPTIONS).toEqual([
      "John 20:21",
      "Matthew 28:19–20",
      "Luke 24:46–48",
      "Acts 1:7–8",
    ]);
  });
});
