"use server";

import { supabase } from "@/lib/db/supabase";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export async function markNotificationRead(id: string): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: "Sign in to update notifications." };

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id)
    .eq("user_id", currentUser.id);

  if (error) {
    console.error("[lib/notifications/notificationActions/markNotificationRead]", error.message);
    return { success: false, error: "Unable to update this notification right now." };
  }

  return { success: true };
}

export async function markAllNotificationsRead(): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: "Sign in to update notifications." };

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", currentUser.id)
    .eq("read", false);

  if (error) {
    console.error("[lib/notifications/notificationActions/markAllNotificationsRead]", error.message);
    return { success: false, error: "Unable to update notifications right now." };
  }

  return { success: true };
}
