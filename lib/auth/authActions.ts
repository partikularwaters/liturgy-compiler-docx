"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/auth/supabaseServer";
import { supabase as supabaseServiceRole } from "@/lib/db/supabase";

// Public self-service signup -- creates the auth.users account, then a
// user_roles row with role "pending" (the Account Request itself, carrying
// the submitted name so the Curator Inbox can show it). Confirmation email
// (if Supabase's SMTP is configured) is sent by Supabase itself as part of
// signUp() -- nothing further to do here for that.
export async function signup(
  firstName: string,
  lastName: string,
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { success: false, error: "Sign-up isn't configured yet -- NEXT_PUBLIC_SUPABASE_ANON_KEY is missing." };
  }
  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." };
  }
  if (!firstName.trim() || !lastName.trim()) {
    return { success: false, error: "First and last name are required." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    console.error("[lib/auth/authActions/signup]", error.message);
    return { success: false, error: error.message };
  }
  if (!data.user) {
    return { success: false, error: "Unable to create that account right now." };
  }

  // Service-role client, not the session-bound one above -- a brand-new
  // signup has no session yet when email confirmation is required, and
  // user_roles' own RLS only allows a Curator to write rows anyway (see
  // 20260725030000_user_roles.sql). This one insert is the sanctioned
  // exception: it's how a pending Account Request is created in the first
  // place, before any Curator is involved.
  const { error: roleError } = await supabaseServiceRole.from("user_roles").insert({
    user_id: data.user.id,
    role: "pending",
    first_name: firstName.trim(),
    last_name: lastName.trim(),
  });

  if (roleError) {
    console.error("[lib/auth/authActions/signup]", roleError.message);
    return { success: false, error: "Account created, but the request could not be recorded. Contact the Curator." };
  }

  return { success: true };
}

export async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { success: false, error: "Sign-in isn't configured yet -- NEXT_PUBLIC_SUPABASE_ANON_KEY is missing." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("[lib/auth/authActions/login]", error.message);
    return { success: false, error: "Incorrect email or password." };
  }

  return { success: true };
}

export async function logout(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

// Sends the reset email -- Supabase's own default template links to
// /auth/confirm?token_hash=...&type=recovery&next=/reset-password (see that
// route), which establishes a session and lands the user on the set-new-
// password form. No account enumeration protection beyond Supabase's own
// defaults -- acceptable for a small church's signup volume (same call as
// weak-password minimums, not building beyond what the scale needs).
export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { success: false, error: "Password reset isn't configured yet -- NEXT_PUBLIC_SUPABASE_ANON_KEY is missing." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    console.error("[lib/auth/authActions/requestPasswordReset]", error.message);
    return { success: false, error: "Unable to send a reset email right now." };
  }

  return { success: true };
}

// Only works when called with a session established by the /auth/confirm
// recovery link -- there is no separate "current password" check here
// because reaching this page at all already proves control of the email
// inbox (the standard forgot-password trust model).
export async function updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  if (newPassword.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    console.error("[lib/auth/authActions/updatePassword]", error.message);
    return { success: false, error: "Unable to update your password right now." };
  }

  return { success: true };
}
