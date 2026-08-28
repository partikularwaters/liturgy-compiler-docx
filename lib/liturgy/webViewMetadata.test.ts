import { describe, expect, it } from "vitest";
import { buildWebViewDescription, buildWebViewTitle, formatServiceDateDisplay } from "@/lib/liturgy/webViewMetadata";

describe("formatServiceDateDisplay", () => {
  it("formats a YYYY-MM-DD string as a human-readable date, without timezone conversion", () => {
    expect(formatServiceDateDisplay("2026-08-30")).toBe("August 30, 2026");
    expect(formatServiceDateDisplay("2026-01-01")).toBe("January 1, 2026");
    expect(formatServiceDateDisplay("2026-12-31")).toBe("December 31, 2026");
  });
});

describe("buildWebViewTitle", () => {
  it("builds a liturgical-style title from the template name", () => {
    expect(buildWebViewTitle({ templateName: "Morning Worship" })).toBe(
      "The Order for the Morning Worship Service"
    );
    expect(buildWebViewTitle({ templateName: "Vesper Worship" })).toBe(
      "The Order for the Vesper Worship Service"
    );
  });
});

describe("buildWebViewDescription", () => {
  it("includes Lord’s Day # for a Sunday service date", () => {
    // 2026-08-30 is a real Sunday, matching the app's existing test fixtures.
    expect(buildWebViewDescription({ serviceDate: "2026-08-30", lordsDayNumber: 35 })).toBe(
      "August 30, 2026 | Lord’s Day #35"
    );
  });

  it("omits Lord’s Day # for a non-Sunday service date", () => {
    // 2026-08-31 is a Monday.
    expect(buildWebViewDescription({ serviceDate: "2026-08-31", lordsDayNumber: 35 })).toBe("August 31, 2026");
  });
});
