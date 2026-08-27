import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  update: vi.fn(),
  eq1: vi.fn(),
  eq2: vi.fn(),
}));

vi.mock("@/lib/db/supabase", () => ({
  supabase: { from: mocks.from },
}));

import { markDraft } from "@/lib/liturgy/markDraft";

describe("markDraft", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.from.mockReturnValue({ update: mocks.update });
    mocks.update.mockReturnValue({ eq: mocks.eq1 });
    mocks.eq1.mockReturnValue({ eq: mocks.eq2 });
    mocks.eq2.mockResolvedValue({ error: null });
  });

  it("clears status/ready_by/ready_at and scopes the update to currently-ready rows only", async () => {
    const result = await markDraft("liturgy-1");

    expect(result).toEqual({ success: true });
    expect(mocks.update).toHaveBeenCalledWith({ status: "draft", ready_by: null, ready_at: null });
    expect(mocks.eq1).toHaveBeenCalledWith("id", "liturgy-1");
    expect(mocks.eq2).toHaveBeenCalledWith("status", "ready");
  });

  it("is idempotent -- succeeds even when the Liturgy is already Draft (zero rows affected)", async () => {
    mocks.eq2.mockResolvedValue({ error: null });

    const result = await markDraft("already-draft-liturgy");

    expect(result).toEqual({ success: true });
  });

  it("reports failure on a genuine query error", async () => {
    mocks.eq2.mockResolvedValue({ error: { message: "connection refused" } });

    const result = await markDraft("liturgy-1");

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
