import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  getCurrentUser: vi.fn(),
  getCurrentUserName: vi.fn(),
}));

vi.mock("@/lib/db/supabase", () => ({
  supabase: { rpc: mocks.rpc },
}));
vi.mock("@/lib/auth/getCurrentUser", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));
vi.mock("@/lib/auth/getCurrentUserName", () => ({
  getCurrentUserName: mocks.getCurrentUserName,
}));

import { deleteLiturgy } from "@/lib/liturgy/deleteLiturgyAction";

describe("deleteLiturgy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rpc.mockResolvedValue({ error: null });
  });

  it("rejects an anonymous caller before reading the account name", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const result = await deleteLiturgy("liturgy-1");

    expect(result.success).toBe(false);
    expect(mocks.getCurrentUserName).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("rejects a Compiler with no typed confirmation, without deleting", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1", email: "a@b.com", role: "compiler" });
    mocks.getCurrentUserName.mockResolvedValue("Test Compiler");

    const result = await deleteLiturgy("liturgy-1");

    expect(result.success).toBe(false);
    expect(result.error).toContain("type your name");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("rejects a Compiler whose typed confirmation doesn't exactly match their account name", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1", email: "a@b.com", role: "compiler" });
    mocks.getCurrentUserName.mockResolvedValue("Test Compiler");

    const result = await deleteLiturgy("liturgy-1", "test compiler");

    expect(result.success).toBe(false);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("deletes for a Compiler once the typed confirmation matches exactly, recording their role", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1", email: "a@b.com", role: "compiler" });
    mocks.getCurrentUserName.mockResolvedValue("Test Compiler");

    const result = await deleteLiturgy("liturgy-1", "Test Compiler");

    expect(result).toEqual({ success: true });
    expect(mocks.rpc).toHaveBeenCalledWith("delete_liturgy_with_log", {
      p_liturgy_id: "liturgy-1",
      p_deleted_by: "user-1",
      p_deleted_by_name: "Test Compiler",
      p_deleted_role: "compiler",
    });
  });

  it("deletes for a Curator with no typed confirmation at all", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-2", email: "c@b.com", role: "curator" });
    mocks.getCurrentUserName.mockResolvedValue("Test Curator");

    const result = await deleteLiturgy("liturgy-1");

    expect(result).toEqual({ success: true });
    expect(mocks.rpc).toHaveBeenCalledWith("delete_liturgy_with_log", {
      p_liturgy_id: "liturgy-1",
      p_deleted_by: "user-2",
      p_deleted_by_name: "Test Curator",
      p_deleted_role: "curator",
    });
  });

  it("surfaces a failure from the delete RPC without throwing", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-2", email: "c@b.com", role: "curator" });
    mocks.getCurrentUserName.mockResolvedValue("Test Curator");
    mocks.rpc.mockResolvedValue({ error: { message: "boom" } });

    const result = await deleteLiturgy("liturgy-1");

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
