import "server-only";
import { timingSafeEqual } from "crypto";

// The single machine-to-machine credential check for app/api/automation/*.
// Deliberately separate from lib/auth/getCurrentUser.ts -- that resolver is
// for a human Curator/Compiler's Supabase Auth session (cookies), which
// never exists in a server-to-server call from n8n. A shared bearer token,
// not a Supabase Auth service account: this API has exactly one trusted
// caller (self-hosted n8n) over HTTPS, so a single rotatable secret is
// proportionate -- see context/delegation-queue.md's Ticket 7 for the
// tradeoff against the heavier service-account alternative.
export function authorizeAutomationRequest(request: Request): boolean {
  const expectedToken = process.env.AUTOMATION_API_TOKEN;
  // Never authorize if the server itself has no token configured -- a
  // missing env var must fail closed, not silently accept every caller.
  if (!expectedToken) return false;

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;
  const providedToken = header.slice("Bearer ".length);

  const expected = Buffer.from(expectedToken);
  const provided = Buffer.from(providedToken);
  // timingSafeEqual throws on mismatched lengths rather than returning
  // false, so a length mismatch is itself treated as unauthorized.
  if (expected.length !== provided.length) return false;

  return timingSafeEqual(expected, provided);
}
