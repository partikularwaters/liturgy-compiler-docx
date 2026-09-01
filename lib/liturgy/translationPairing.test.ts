import { describe, expect, it } from "vitest";
import { isValidTranslationPair } from "@/lib/liturgy/translationPairingRules";

const row = (overrides: Record<string, unknown> = {}) => ({
  id: "item-a",
  paired_id: null,
  translation: "fil" as const,
  section_name: "Call to Worship",
  kind: null,
  is_guide: false,
  ...overrides,
});

describe("isValidTranslationPair", () => {
  it("allows Songs of the same kind regardless of their Section tags", () => {
    expect(
      isValidTranslationPair(
        "songs",
        row({ kind: "psalm" }),
        row({ id: "item-b", translation: "en", kind: "psalm", section_name: "Hymn of Communion" })
      )
    ).toBe(true);
  });

  it("rejects a Song pair when the kind changes", () => {
    expect(
      isValidTranslationPair("songs", row({ kind: "psalm" }), row({ id: "item-b", translation: "en", kind: "hymn" }))
    ).toBe(false);
  });

  it("requires Formula and Prayer pairs to retain their Section and type", () => {
    expect(
      isValidTranslationPair(
        "formulas",
        row({ kind: "affirmation" }),
        row({ id: "item-b", translation: "en", kind: "affirmation" })
      )
    ).toBe(true);
    expect(
      isValidTranslationPair(
        "formulas",
        row({ kind: "affirmation" }),
        row({ id: "item-b", translation: "en", section_name: "Assurance of Pardon", kind: "affirmation" })
      )
    ).toBe(false);
    expect(
      isValidTranslationPair(
        "formulas",
        row({ kind: "affirmation" }),
        row({ id: "item-b", translation: "en", kind: "covenant" })
      )
    ).toBe(false);
    expect(
      isValidTranslationPair(
        "prayers",
        row({ is_guide: false }),
        row({ id: "item-b", translation: "en", is_guide: true })
      )
    ).toBe(false);
  });
});
