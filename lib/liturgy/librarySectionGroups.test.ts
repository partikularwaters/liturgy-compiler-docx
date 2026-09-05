import { describe, expect, it } from "vitest";
import { getLibraryGroup, sectionsShareLibrary } from "@/lib/liturgy/librarySectionGroups";

describe("librarySectionGroups", () => {
  it("groups Morning's split Offertory Sections with Vesper's combined one", () => {
    expect(getLibraryGroup("Offertory Call")).toBe("Offertory");
    expect(getLibraryGroup("Offertory & Thanksgiving")).toBe("Offertory");
    expect(sectionsShareLibrary("Offertory Call", "Offertory & Thanksgiving")).toBe(true);
  });

  it("leaves every other Section name as its own group", () => {
    expect(getLibraryGroup("Call to Worship")).toBe("Call to Worship");
    expect(sectionsShareLibrary("Call to Worship", "Prayer of Invocation")).toBe(false);
  });

  it("does not group Morning's Song-only Psalm of Thanksgiving with Offertory", () => {
    // Song sharing is handled entirely by song_section_tags, not this
    // module -- see this file's own header comment.
    expect(sectionsShareLibrary("Psalm of Thanksgiving", "Offertory Call")).toBe(false);
  });
});
