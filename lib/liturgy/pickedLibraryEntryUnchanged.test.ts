import { describe, expect, it } from "vitest";
import { songEntryUnchanged, prayerEntryUnchanged } from "./pickedLibraryEntryUnchanged";

describe("songEntryUnchanged", () => {
  const original = { title: "Holy, Holy, Holy", attribution: "Reginald Heber", yearPublished: "1826", notes: null };

  it("is true when every field still matches the picked entry", () => {
    expect(
      songEntryUnchanged(original, { title: "Holy, Holy, Holy", attribution: "Reginald Heber", yearPublished: "1826", notes: "" })
    ).toBe(true);
  });

  it("is false when the title was edited", () => {
    expect(
      songEntryUnchanged(original, { title: "Holy Holy Holy", attribution: "Reginald Heber", yearPublished: "1826", notes: "" })
    ).toBe(false);
  });

  it("is false when a null field was filled in", () => {
    expect(
      songEntryUnchanged(original, { title: "Holy, Holy, Holy", attribution: "Reginald Heber", yearPublished: "1826", notes: "New note" })
    ).toBe(false);
  });

  it("is false when nothing was picked yet (no matching original)", () => {
    expect(songEntryUnchanged(undefined, { title: "", attribution: "", yearPublished: "", notes: "" })).toBe(false);
  });
});

describe("prayerEntryUnchanged", () => {
  it("is true when the text still matches the picked entry", () => {
    expect(prayerEntryUnchanged({ text: "Our Father..." }, "Our Father...")).toBe(true);
  });

  it("is false when the text was edited", () => {
    expect(prayerEntryUnchanged({ text: "Our Father..." }, "Our Father, who art in heaven...")).toBe(false);
  });

  it("is false when nothing was picked yet (no matching original)", () => {
    expect(prayerEntryUnchanged(undefined, "")).toBe(false);
  });
});
