import { beforeEach, describe, expect, it, vi } from "vitest";
// "server-only" is a Next.js build-time marker package, not a real
// installed dependency -- automationUrls.ts imports it directly (unmocked),
// so it needs an explicit stub to load under Vitest.
vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  authorize: vi.fn(),
  ensureWeek: vi.fn(),
}));

vi.mock("@/lib/auth/automationAuth", () => ({ authorizeAutomationRequest: mocks.authorize }));
vi.mock("@/lib/liturgy/ensureWeek", () => ({ ensureWeek: mocks.ensureWeek }));

import { POST } from "@/app/api/automation/ensure-week/route";

function request(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("https://example.com/api/automation/ensure-week", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("POST /api/automation/ensure-week", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a request with a missing/wrong credential before touching ensureWeek", async () => {
    mocks.authorize.mockReturnValue(false);

    const response = await POST(request({ upcomingSunday: "2026-08-30" }));

    expect(response.status).toBe(401);
    expect(mocks.ensureWeek).not.toHaveBeenCalled();
  });

  it("rejects a malformed date before calling ensureWeek", async () => {
    mocks.authorize.mockReturnValue(true);

    const response = await POST(request({ upcomingSunday: "not-a-date" }));

    expect(response.status).toBe(400);
    expect(mocks.ensureWeek).not.toHaveBeenCalled();
  });

  it("returns both liturgy ids, created flags, and compile view urls on success", async () => {
    mocks.authorize.mockReturnValue(true);
    mocks.ensureWeek.mockResolvedValue({
      morningLiturgyId: "morning-1",
      vesperLiturgyId: "vesper-1",
      morningCreated: true,
      vesperCreated: false,
    });

    const response = await POST(request({ upcomingSunday: "2026-08-30" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      morningLiturgyId: "morning-1",
      vesperLiturgyId: "vesper-1",
      morningCreated: true,
      vesperCreated: false,
    });
    expect(body.morningCompileViewUrl).toContain("/liturgy/morning-1");
    expect(body.vesperCompileViewUrl).toContain("/liturgy/vesper-1");
  });

  it("fails closed (5xx) when ensureWeek itself fails", async () => {
    mocks.authorize.mockReturnValue(true);
    mocks.ensureWeek.mockResolvedValue(null);

    const response = await POST(request({ upcomingSunday: "2026-08-30" }));

    expect(response.status).toBe(502);
  });

  it("fails closed (5xx) on an unexpected thrown error", async () => {
    mocks.authorize.mockReturnValue(true);
    mocks.ensureWeek.mockRejectedValue(new Error("boom"));

    const response = await POST(request({ upcomingSunday: "2026-08-30" }));

    expect(response.status).toBe(500);
  });
});
