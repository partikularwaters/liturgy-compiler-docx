import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// "server-only" is a Next.js build-time marker package resolved by Next's
// own bundler, not a real installed dependency -- Vitest needs an explicit
// stub to load any file that imports it directly (unmocked) under test.
vi.mock("server-only", () => ({}));
import { authorizeAutomationRequest } from "@/lib/auth/automationAuth";

const ORIGINAL_TOKEN = process.env.AUTOMATION_API_TOKEN;

function requestWithAuth(header?: string): Request {
  return new Request("https://example.com/api/automation/status", {
    headers: header ? { authorization: header } : undefined,
  });
}

describe("authorizeAutomationRequest", () => {
  beforeEach(() => {
    process.env.AUTOMATION_API_TOKEN = "a-long-random-shared-secret";
  });

  afterEach(() => {
    process.env.AUTOMATION_API_TOKEN = ORIGINAL_TOKEN;
  });

  it("authorizes a request bearing the exact configured token", () => {
    expect(authorizeAutomationRequest(requestWithAuth("Bearer a-long-random-shared-secret"))).toBe(true);
  });

  it("rejects a missing Authorization header", () => {
    expect(authorizeAutomationRequest(requestWithAuth())).toBe(false);
  });

  it("rejects a non-Bearer Authorization header", () => {
    expect(authorizeAutomationRequest(requestWithAuth("Basic a-long-random-shared-secret"))).toBe(false);
  });

  it("rejects a wrong token", () => {
    expect(authorizeAutomationRequest(requestWithAuth("Bearer wrong-token"))).toBe(false);
  });

  it("rejects a token of a different length than the configured one", () => {
    expect(authorizeAutomationRequest(requestWithAuth("Bearer short"))).toBe(false);
  });

  it("fails closed when no token is configured at all, even if one is provided", () => {
    delete process.env.AUTOMATION_API_TOKEN;
    expect(authorizeAutomationRequest(requestWithAuth("Bearer anything"))).toBe(false);
  });
});
