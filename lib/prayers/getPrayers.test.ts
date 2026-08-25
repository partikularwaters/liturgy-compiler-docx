import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  select: vi.fn(),
}));

vi.mock("@/lib/db/supabase", () => ({
  supabase: { from: mocks.from },
}));

import { getPrayers } from "@/lib/prayers/getPrayers";

describe("getPrayers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.from.mockReturnValue({ select: mocks.select });
  });

  it("returns null on a genuine query failure, distinct from an empty library", async () => {
    mocks.select.mockResolvedValue({ data: null, error: { message: "connection refused" } });

    const result = await getPrayers();

    expect(result).toBeNull();
  });

  it("returns an empty array for a genuinely empty library", async () => {
    mocks.select.mockResolvedValue({ data: [], error: null });

    const result = await getPrayers();

    expect(result).toEqual([]);
  });
});
