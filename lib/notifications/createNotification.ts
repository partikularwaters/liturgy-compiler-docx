import { supabase } from "@/lib/db/supabase";
import type { NotificationType } from "@/types/notifications";

// Called only from trusted server-side mutation paths (grantRole,
// amendExisting, createAsNew, rejectSubmission) -- never invoked directly
// from a client, so this is a plain function, not a Server Action.
// Best-effort: the caller's own action has already succeeded by the time
// this runs, so a failure here (logged, not thrown) must never roll back
// or fail that real work over a lost notification.
export async function createNotification(
  userId: string,
  type: NotificationType,
  message: string,
  link: string | null = null
): Promise<void> {
  const { error } = await supabase.from("notifications").insert({ user_id: userId, type, message, link });
  if (error) {
    console.error("[lib/notifications/createNotification]", error.message);
  }
}
