import { supabase } from "@/lib/db/supabase";

export interface ActiveAccount {
  userId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: "curator" | "compiler";
}

// Every account with a real, granted role (as opposed to a still-pending
// Account Request) -- the surface a Curator needs to delete an account from,
// which is what actually puts that person's Library drafts into the Bin.
export async function getActiveAccounts(): Promise<ActiveAccount[]> {
  const { data: rows, error } = await supabase
    .from("user_roles")
    .select("user_id, first_name, last_name, role")
    .in("role", ["curator", "compiler"])
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[lib/curatorInbox/getActiveAccounts]", error.message);
    return [];
  }
  if (!rows || rows.length === 0) return [];

  return Promise.all(
    rows.map(async (row) => {
      const { data: userData } = await supabase.auth.admin.getUserById(row.user_id);
      return {
        userId: row.user_id,
        email: userData?.user?.email ?? null,
        firstName: row.first_name,
        lastName: row.last_name,
        role: row.role as "curator" | "compiler",
      };
    })
  );
}
