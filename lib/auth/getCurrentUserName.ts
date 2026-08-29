import "server-only";

import { supabase } from "@/lib/db/supabase";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// `CurrentUser` (getCurrentUser.ts) deliberately carries only id/email/role
// -- every existing caller only needs those. This is a narrow, separate
// lookup for the one feature that needs a human display name: the liturgy
// deletion dialog's GitHub-style "type this to confirm" reference string,
// and the permanent record it writes. Falls back to the account's email
// when neither name is set, so the confirmation string is never blank.
export async function getCurrentUserName(): Promise<string | null> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  const { data, error } = await supabase
    .from("user_roles")
    .select("first_name, last_name")
    .eq("user_id", currentUser.id)
    .single();

  if (error) {
    console.error("[lib/auth/getCurrentUserName]", error.message);
    return currentUser.email;
  }

  const fullName = [data.first_name, data.last_name].filter(Boolean).join(" ").trim();
  return fullName || currentUser.email;
}
