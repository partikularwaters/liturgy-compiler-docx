import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CompiledLiturgy } from "@/types/liturgy";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  getCurrentUser: vi.fn(),
  getLiturgy: vi.fn(),
}));

vi.mock("@/lib/db/supabase", () => ({
  supabase: { from: mocks.from },
}));
vi.mock("@/lib/auth/getCurrentUser", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));
vi.mock("@/lib/liturgy/getLiturgy", () => ({
  getLiturgy: mocks.getLiturgy,
}));

import { markReady } from "@/lib/liturgy/liturgyReadinessActions";

function liturgy(overrides: Partial<CompiledLiturgy> = {}): CompiledLiturgy {
  return {
    id: "liturgy-1",
    templateName: "Morning Worship",
    serviceDate: "2026-08-30",
    lordsDayNumber: 35,
    sections: [
      {
        name: "Call to Worship",
        posture: "standing",
        dynamic_naming: false,
        items: [{ id: "s1", type: "selection", text: "text", citation: "Ps 1:1" }],
        columnBreakBefore: false,
        showPrayerGuide: true, silentConfessionLanguage: "fil", mergeSelections: false,
      },
    ],
    showEndNote: true,
    status: "draft",
    readyAt: null,
    ...overrides,
  };
}

describe("markReady", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.from.mockReturnValue({ update: mocks.update });
    mocks.update.mockReturnValue({ eq: mocks.eq });
    mocks.eq.mockResolvedValue({ error: null });
  });

  it("rejects an anonymous caller before reading the liturgy", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const result = await markReady("liturgy-1");

    expect(result.success).toBe(false);
    expect(mocks.getLiturgy).not.toHaveBeenCalled();
  });

  it("rejects when the liturgy is missing required Sections, without writing", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1", email: "a@b.com", role: "compiler" });
    mocks.getLiturgy.mockResolvedValue(
      liturgy({
        sections: [
          {
            name: "Call to Worship",
            posture: "standing",
            dynamic_naming: false,
            items: [],
            columnBreakBefore: false,
            showPrayerGuide: true, silentConfessionLanguage: "fil", mergeSelections: false,
          },
        ],
      })
    );

    const result = await markReady("liturgy-1");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Call to Worship");
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("marks a fully-complete liturgy ready and records who/when", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1", email: "a@b.com", role: "compiler" });
    mocks.getLiturgy.mockResolvedValue(liturgy());

    const result = await markReady("liturgy-1");

    expect(result).toEqual({ success: true });
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "ready", ready_by: "user-1", ready_at: expect.any(String) })
    );
    expect(mocks.eq).toHaveBeenCalledWith("id", "liturgy-1");
  });

  it("fails closed when the liturgy can't be found/read", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1", email: "a@b.com", role: "compiler" });
    mocks.getLiturgy.mockResolvedValue(null);

    const result = await markReady("liturgy-1");

    expect(result.success).toBe(false);
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
