import { describe, expect, it } from "vitest";
import { formatCitation } from "./formatCitation";

describe("formatCitation", () => {
  it("uses en dashes for every numeric verse range", () => {
    expect(formatCitation("Psalm 47:5-9; John 3:16-18")).toBe("Psalm 47:5–9; John 3:16–18");
  });

  it("leaves non-range hyphens unchanged", () => {
    expect(formatCitation("A reference-only note")).toBe("A reference-only note");
  });
});
