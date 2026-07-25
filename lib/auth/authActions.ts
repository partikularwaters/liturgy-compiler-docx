"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/auth/supabaseServer";

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
