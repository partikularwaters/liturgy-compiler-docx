import { supabase } from "@/lib/db/supabase";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import type { AppNotification } from "@/types/notifications";

export async function getNotifications(): Promise<AppNotification[]> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, message, link, read, created_at")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[lib/notifications/getNotifications]", error.message);
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    type: row.type,
    message: row.message,
    link: row.link,
    read: row.read,
    createdAt: row.created_at,
  }));
}

// Threaded through TopNav so the Account menu can show a visual cue (a
// small dot on the icon) without fetching every notification's full body
// just to know whether any are unread.
export async function getUnreadNotificationCount(): Promise<number> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return 0;

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", currentUser.id)
    .eq("read", false);

  if (error) {
    console.error("[lib/notifications/getNotifications/getUnreadNotificationCount]", error.message);
    return 0;
  }

  return count ?? 0;
}
