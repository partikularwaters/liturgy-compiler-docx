import { describe, expect, it } from "vitest";
import { compareCitations } from "./canonicalOrder";

describe("compareCitations", () => {
  it("orders pure-range citations by chapter", () => {
    expect(compareCitations("Psalms 29:1–4", "Psalms 130:2–3")).toBeLessThan(0);
  });

  it("orders mixed range-plus-single citations by chapter, not lexicographically", () => {
    // Regression: parseCitationReference used to fail to parse a mixed
    // verse spec ("1–2, 10"), falling back to string comparison, which put
    // Psalm 146 before Psalm 29 ("1" < "2" as characters).
    expect(compareCitations("Psalms 146:1–2, 10", "Psalms 29:1–4")).toBeGreaterThan(0);
  });

  it("sorts a real mixed-format list into chapter order", () => {
    const citations = [
      "Psalms 146:1–2, 10",
      "Psalms 29:1–4",
      "Psalms 106:1,48",
      "Psalms 99:1–3, 5",
      "Psalms 48:1–3, 14",
    ];
    const sorted = [...citations].sort(compareCitations);
    expect(sorted).toEqual([
      "Psalms 29:1–4",
      "Psalms 48:1–3, 14",
      "Psalms 99:1–3, 5",
      "Psalms 106:1,48",
      "Psalms 146:1–2, 10",
    ]);
  });
});
