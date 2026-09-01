import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  consoleError: vi.spyOn(console, "error").mockImplementation(() => undefined),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/supabase", () => ({ supabase: { from: mocks.from } }));

import { setTranslationPair } from "@/lib/liturgy/translationPairing";

const row = (overrides: Record<string, unknown> = {}) => ({
  id: "formula-a",
  paired_id: "formula-old",
  translation: "fil",
  section_name: "Affirmation of Faith",
  kind: "affirmation",
  ...overrides,
});

function selectResponse(result: { data: unknown; error: { message: string } | null }) {
  return {
    select: () => ({
      eq: () => ({
        single: vi.fn().mockResolvedValue(result),
      }),
    }),
  };
}

describe("setTranslationPair", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an error when invalid-pair cleanup cannot clear the old companion", async () => {
    mocks.from
      .mockReturnValueOnce(selectResponse({ data: row(), error: null }))
      .mockReturnValueOnce(selectResponse({ data: row({ id: "formula-b", translation: "en", kind: "covenant" }), error: null }))
      .mockReturnValueOnce({
        update: () => ({
          eq: () => ({
            eq: vi.fn().mockResolvedValue({ error: { message: "database unavailable" } }),
          }),
        }),
      });

    await expect(setTranslationPair("formulas", "formula-a", "formula-b")).resolves.toEqual({
      success: false,
      error: "Unable to update this pairing right now.",
    });
  });

  it("does not clear an existing pair when the requested companion cannot be read", async () => {
    mocks.from
      .mockReturnValueOnce(selectResponse({ data: row(), error: null }))
      .mockReturnValueOnce(selectResponse({ data: null, error: { message: "database unavailable" } }));

    await expect(setTranslationPair("formulas", "formula-a", "formula-b")).resolves.toEqual({
      success: false,
      error: "Unable to update this pairing right now.",
    });
    expect(mocks.from).toHaveBeenCalledTimes(2);
  });
});
