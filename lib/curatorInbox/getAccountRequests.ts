import { supabase } from "@/lib/db/supabase";

export interface AccountRequest {
  userId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
}

// Pending Account Requests -- a user_roles row with role "pending" IS the
// request (see 20260726010000's comment). Email lives on auth.users, not
// user_roles, so each pending row needs one Admin API lookup to show it --
// fine at this app's scale (a small church, not hundreds of signups/day).
export async function getAccountRequests(): Promise<AccountRequest[]> {
  const { data: pendingRows, error } = await supabase
    .from("user_roles")
    .select("user_id, first_name, last_name, created_at")
    .eq("role", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[lib/curatorInbox/getAccountRequests]", error.message);
    return [];
  }
  if (!pendingRows || pendingRows.length === 0) return [];

  const requests = await Promise.all(
    pendingRows.map(async (row) => {
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(row.user_id);
      if (userError) {
        console.error("[lib/curatorInbox/getAccountRequests]", userError.message);
      }
      return {
        userId: row.user_id,
        email: userData?.user?.email ?? null,
        firstName: row.first_name,
        lastName: row.last_name,
        createdAt: row.created_at,
      };
    })
  );

  return requests;
}
