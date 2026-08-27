import { beforeEach, describe, expect, it, vi } from "vitest";
// "server-only" is a Next.js build-time marker package, not a real
// installed dependency -- automationUrls.ts imports it directly (unmocked),
// so it needs an explicit stub to load under Vitest.
vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  authorize: vi.fn(),
  from: vi.fn(),
  getLiturgy: vi.fn(),
}));

vi.mock("@/lib/auth/automationAuth", () => ({ authorizeAutomationRequest: mocks.authorize }));
vi.mock("@/lib/db/supabase", () => ({ supabase: { from: mocks.from } }));
vi.mock("@/lib/liturgy/getLiturgy", () => ({ getLiturgy: mocks.getLiturgy }));

import { GET } from "@/app/api/automation/status/route";

function request(query: string): Request {
  return new Request(`https://example.com/api/automation/status${query}`, {
    headers: { authorization: "Bearer token" },
  });
}

const fakeLiturgy = {
  id: "liturgy-1",
  templateName: "Morning Worship",
  serviceDate: "2026-08-30",
  lordsDayNumber: 35,
  sections: [],
  showEndNote: true,
};

describe("GET /api/automation/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authorize.mockReturnValue(true);
  });

  it("rejects a request with a missing/wrong credential before touching Supabase", async () => {
    mocks.authorize.mockReturnValue(false);

    const response = await GET(request("?date=2026-08-30"));

    expect(response.status).toBe(401);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("rejects a malformed date", async () => {
    const response = await GET(request("?date=not-a-date"));

    expect(response.status).toBe(400);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("returns status, ready_at, and progress for every liturgy on that date", async () => {
    mocks.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({
          data: [{ id: "liturgy-1", status: "ready", ready_at: "2026-08-30T00:00:00+00:00" }],
          error: null,
        }),
      })),
    });
    mocks.getLiturgy.mockResolvedValue(fakeLiturgy);

    const response = await GET(request("?date=2026-08-30"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.liturgies).toHaveLength(1);
    // readyAt must be handed back verbatim -- record-publication has no
    // other way to know which revision n8n is about to publish.
    expect(body.liturgies[0]).toMatchObject({
      id: "liturgy-1",
      status: "ready",
      readyAt: "2026-08-30T00:00:00+00:00",
      templateName: "Morning Worship",
      lordsDayNumber: 35,
    });
    expect(body.liturgies[0].compileViewUrl).toContain("/liturgy/liturgy-1");
    expect(body.liturgies[0].webViewUrl).toContain("/liturgy/liturgy-1/view");
  });

  it("fails closed (5xx) when the liturgies query itself fails", async () => {
    mocks.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: null, error: { message: "connection refused" } }),
      })),
    });

    const response = await GET(request("?date=2026-08-30"));

    expect(response.status).toBe(502);
  });

  it("fails closed (5xx) when any individual liturgy's read fails, not just partial data", async () => {
    mocks.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({
          data: [
            { id: "liturgy-1", status: "draft" },
            { id: "liturgy-2", status: "ready" },
          ],
          error: null,
        }),
      })),
    });
    mocks.getLiturgy.mockImplementation(async (id: string) => (id === "liturgy-1" ? fakeLiturgy : null));

    const response = await GET(request("?date=2026-08-30"));

    expect(response.status).toBe(502);
  });
});
