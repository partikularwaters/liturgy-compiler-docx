import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  select: vi.fn(),
  orderSection: vi.fn(),
  orderTitle: vi.fn(),
}));

vi.mock("@/lib/db/supabase", () => ({
  supabase: { from: mocks.from },
}));

import { getSongs } from "@/lib/songs/getSongs";

describe("getSongs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.from.mockReturnValue({ select: mocks.select });
    mocks.select.mockReturnValue({ order: mocks.orderSection });
    mocks.orderSection.mockReturnValue({ order: mocks.orderTitle });
  });

  it("returns null on a genuine query failure, distinct from an empty library", async () => {
    mocks.orderTitle.mockResolvedValue({ data: null, error: { message: "connection refused" } });

    const result = await getSongs();

    expect(result).toBeNull();
  });

  it("returns an empty array for a genuinely empty library", async () => {
    mocks.orderTitle.mockResolvedValue({ data: [], error: null });

    const result = await getSongs();

    expect(result).toEqual([]);
  });

  it("filters by tag while preserving every Section tag on the returned Song", async () => {
    mocks.orderTitle.mockResolvedValue({
      data: [
        {
          id: "song-1",
          section_name: "Psalm of Adoration",
          kind: "hymn",
          title: "A shared Hymn",
          attribution: null,
          year_published: null,
          notes: null,
          owner_id: null,
          translation: "en",
          paired_id: null,
          song_section_tags: [{ section_name: "Psalm of Adoration" }, { section_name: "Hymn of Communion" }],
        },
      ],
      error: null,
    });

    const result = await getSongs("Hymn of Communion");

    expect(result).toHaveLength(1);
    expect(result?.[0].sectionNames).toEqual(["Psalm of Adoration", "Hymn of Communion"]);
  });
});
