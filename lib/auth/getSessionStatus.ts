import { createSupabaseServerClient } from "@/lib/auth/supabaseServer";
import type { Role } from "@/lib/auth/getCurrentUser";

export type SessionStatus =
  | { kind: "anonymous" }
  | { kind: "pending"; firstName: string | null }
  | { kind: "active"; role: Role };

// getCurrentUser() deliberately collapses "never signed up" and "signed up,
// waiting for a Curator to grant a role" into the same `null` -- a pending
// user must have zero permissions, identical to anonymous, everywhere that
// function's contract is relied on for gating. But the nav needs to tell
// the two apart: without it, a pending visitor sees plain Sign In/Sign Up
// on every single visit while they wait, as if their signup never happened.
// This is a separate function (not a change to getCurrentUser's contract)
// specifically for that one presentational purpose.
export async function getSessionStatus(): Promise<SessionStatus> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return { kind: "anonymous" };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { kind: "anonymous" };

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role, first_name")
    .eq("user_id", user.id)
    .single();

  if (!roleRow) return { kind: "anonymous" };

  if (roleRow.role === "pending") {
    return { kind: "pending", firstName: roleRow.first_name ?? null };
  }

  return { kind: "active", role: roleRow.role as Role };
}
