import { createSupabaseServerClient } from "@/lib/auth/supabaseServer";

export type Role = "curator" | "compiler";
type StoredRole = Role | "pending";

export interface CurrentUser {
  id: string;
  email: string | null;
  role: Role;
}

// The single source of truth for "who is this, and what can they do" --
// every Server Action/page that needs to gate something calls this rather
// than reading auth state ad hoc. Returns null for a genuinely anonymous
// visitor (no session) OR a signed-in user with no row in user_roles yet
// (treated the same as anonymous -- a role must be explicitly granted by a
// Curator, never assumed).
export async function getCurrentUser(): Promise<CurrentUser | null> {
  // NEXT_PUBLIC_SUPABASE_ANON_KEY isn't provisioned in this environment yet
  // -- every page calls this via TopNav.tsx, so it must degrade to
  // "anonymous" rather than crash every page in the app until the key is
  // added and the user_roles migration is run.
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: roleRow, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  // A genuinely missing row (no role granted yet) is expected and silent --
  // any other error (RLS misconfiguration, connectivity) is not, and was
  // previously swallowed here entirely, which is exactly what made the
  // 2026-07-25 infinite-recursion RLS bug silently degrade to "looks signed
  // out" instead of surfacing anything actionable.
  if (roleError && roleError.code !== "PGRST116") {
    console.error("[lib/auth/getCurrentUser]", roleError.message);
  }
  if (!roleRow) return null;

  // A signed-up-but-not-yet-approved user has a row (role: "pending") so
  // their Account Request can carry their name -- but they have no real
  // permissions until a Curator grants curator/compiler, same as anonymous.
  const storedRole = roleRow.role as StoredRole;
  if (storedRole === "pending") return null;

  return { id: user.id, email: user.email ?? null, role: storedRole };
}

export async function isCurator(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === "curator";
}
