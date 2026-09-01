import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getSectionContext: vi.fn(),
  insertSectionItem: vi.fn(),
  from: vi.fn(),
  songSelect: vi.fn(),
  songEq: vi.fn(),
  songSingle: vi.fn(),
  tagSelect: vi.fn(),
  tagSongEq: vi.fn(),
  tagSectionEq: vi.fn(),
  tagMaybeSingle: vi.fn(),
}));

vi.mock("@/lib/auth/getCurrentUser", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/liturgy/getSectionContext", () => ({ getSectionContext: mocks.getSectionContext }));
vi.mock("@/lib/liturgy/sectionItems", () => ({ insertSectionItem: mocks.insertSectionItem }));
vi.mock("@/lib/db/supabase", () => ({ supabase: { from: mocks.from } }));

import { addSong } from "@/lib/liturgy/addSongAction";

describe("addSong", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUser.mockResolvedValue({ id: "compiler-id", email: "compiler@example.test", role: "compiler" });
    mocks.getSectionContext.mockResolvedValue({ id: "section-id", sectionName: "Hymn of Communion", items: [] });
    mocks.insertSectionItem.mockResolvedValue({ success: true });

    mocks.songSingle.mockResolvedValue({
      data: { title: "A shared Hymn", kind: "hymn", attribution: null, year_published: null, notes: null },
      error: null,
    });
    mocks.songEq.mockReturnValue({ single: mocks.songSingle });
    mocks.songSelect.mockReturnValue({ eq: mocks.songEq });

    mocks.tagMaybeSingle.mockResolvedValue({ data: { song_id: "song-id" }, error: null });
    mocks.tagSectionEq.mockReturnValue({ maybeSingle: mocks.tagMaybeSingle });
    mocks.tagSongEq.mockReturnValue({ eq: mocks.tagSectionEq });
    mocks.tagSelect.mockReturnValue({ eq: mocks.tagSongEq });

    mocks.from.mockImplementation((table: string) => {
      if (table === "songs") return { select: mocks.songSelect };
      if (table === "song_section_tags") return { select: mocks.tagSelect };
      throw new Error(`Unexpected table: ${table}`);
    });
  });

  it("allows placement through a secondary song_section_tags membership", async () => {
    await expect(addSong("liturgy-id", 10, "song-id")).resolves.toEqual({ success: true });

    expect(mocks.tagSectionEq).toHaveBeenCalledWith("section_name", "Hymn of Communion");
    expect(mocks.insertSectionItem).toHaveBeenCalledWith(
      "section-id",
      expect.objectContaining({ type: "song", songId: "song-id", title: "A shared Hymn" })
    );
  });

  it("rejects a Song with no tag for the target Section", async () => {
    mocks.tagMaybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(addSong("liturgy-id", 10, "song-id")).resolves.toEqual({
      success: false,
      error: "That Song does not belong to this Section.",
    });

    expect(mocks.insertSectionItem).not.toHaveBeenCalled();
  });
});
