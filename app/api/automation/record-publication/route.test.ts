import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authorize: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/lib/auth/automationAuth", () => ({ authorizeAutomationRequest: mocks.authorize }));
vi.mock("@/lib/db/supabase", () => ({ supabase: { from: mocks.from } }));

import { POST } from "@/app/api/automation/record-publication/route";

function request(body: unknown): Request {
  return new Request("https://example.com/api/automation/record-publication", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer token" },
    body: JSON.stringify(body),
  });
}

function mockLiturgiesTable(current: { status: string; ready_at: string | null } | null, readError: unknown = null) {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: current, error: readError }),
      })),
    })),
  };
}

describe("POST /api/automation/record-publication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authorize.mockReturnValue(true);
  });

  it("rejects a request with a missing/wrong credential before touching Supabase", async () => {
    mocks.authorize.mockReturnValue(false);

    const response = await POST(request({ liturgyId: "l1", readyAt: "2026-08-27T00:00:00.000Z" }));

    expect(response.status).toBe(401);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("delivers on a fresh, still-current ready_at", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mocks.from.mockImplementation((table: string) => {
      if (table === "liturgies") return mockLiturgiesTable({ status: "ready", ready_at: "2026-08-27T00:00:00.000Z" });
      if (table === "liturgy_publications") return { insert };
      throw new Error(`Unexpected table: ${table}`);
    });

    const response = await POST(request({ liturgyId: "l1", readyAt: "2026-08-27T00:00:00.000Z" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ delivered: true });
    expect(insert).toHaveBeenCalledWith({ liturgy_id: "l1", ready_at: "2026-08-27T00:00:00.000Z" });
  });

  it("delivers when the stored and requested ready_at are the same instant in different string formats", async () => {
    // Postgres/PostgREST commonly returns a timestamptz as
    // "2026-08-27T00:00:00+00:00" even when the value was originally
    // written as an ISO string ending in "Z" -- a strict string comparison
    // would wrongly reject this as a stale revision.
    const insert = vi.fn().mockResolvedValue({ error: null });
    mocks.from.mockImplementation((table: string) => {
      if (table === "liturgies") return mockLiturgiesTable({ status: "ready", ready_at: "2026-08-27T00:00:00+00:00" });
      if (table === "liturgy_publications") return { insert };
      throw new Error(`Unexpected table: ${table}`);
    });

    const response = await POST(request({ liturgyId: "l1", readyAt: "2026-08-27T00:00:00.000Z" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ delivered: true });
    // Stores the server's own canonical value, not the client's string.
    expect(insert).toHaveBeenCalledWith({ liturgy_id: "l1", ready_at: "2026-08-27T00:00:00+00:00" });
  });

  it("treats a duplicate ready_at (unique violation) as already delivered, not an error", async () => {
    mocks.from.mockImplementation((table: string) => {
      if (table === "liturgies") return mockLiturgiesTable({ status: "ready", ready_at: "2026-08-27T00:00:00.000Z" });
      if (table === "liturgy_publications") {
        return { insert: vi.fn().mockResolvedValue({ error: { code: "23505", message: "duplicate key" } }) };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const response = await POST(request({ liturgyId: "l1", readyAt: "2026-08-27T00:00:00.000Z" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ delivered: false, reason: "already_delivered" });
  });

  it("rejects delivery when the liturgy has since returned to Draft", async () => {
    mocks.from.mockImplementation((table: string) => {
      if (table === "liturgies") return mockLiturgiesTable({ status: "draft", ready_at: null });
      throw new Error(`Unexpected table: ${table}`);
    });

    const response = await POST(request({ liturgyId: "l1", readyAt: "2026-08-27T00:00:00.000Z" }));
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({ delivered: false, reason: "no_longer_ready" });
  });

  it("rejects delivery when ready_at has moved on to a newer revision", async () => {
    mocks.from.mockImplementation((table: string) => {
      if (table === "liturgies") return mockLiturgiesTable({ status: "ready", ready_at: "2026-08-28T00:00:00.000Z" });
      throw new Error(`Unexpected table: ${table}`);
    });

    const response = await POST(request({ liturgyId: "l1", readyAt: "2026-08-27T00:00:00.000Z" }));

    expect(response.status).toBe(409);
  });

  it("fails closed (5xx) when the current-state read itself fails", async () => {
    mocks.from.mockImplementation((table: string) => {
      if (table === "liturgies") return mockLiturgiesTable(null, { message: "connection refused" });
      throw new Error(`Unexpected table: ${table}`);
    });

    const response = await POST(request({ liturgyId: "l1", readyAt: "2026-08-27T00:00:00.000Z" }));

    expect(response.status).toBe(502);
  });
});
