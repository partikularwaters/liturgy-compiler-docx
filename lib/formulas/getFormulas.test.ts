import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  select: vi.fn(),
  order: vi.fn(),
}));

vi.mock("@/lib/db/supabase", () => ({
  supabase: { from: mocks.from },
}));

import { getFormulas } from "@/lib/formulas/getFormulas";

describe("getFormulas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.from.mockReturnValue({ select: mocks.select });
    mocks.select.mockReturnValue({ order: mocks.order });
  });

  it("returns null on a genuine query failure, distinct from an empty library", async () => {
    mocks.order.mockResolvedValue({ data: null, error: { message: "connection refused" } });

    const result = await getFormulas();

    expect(result).toBeNull();
  });

  it("returns an empty array for a genuinely empty library", async () => {
    mocks.order.mockResolvedValue({ data: [], error: null });

    const result = await getFormulas();

    expect(result).toEqual([]);
  });
});
