import { createBrowserClient } from "@supabase/ssr";

// Client-side Supabase client -- used only by the login form (email/password
// sign-in has to happen in the browser so Supabase can set the session
// cookie via document.cookie). Everything else in the app stays server-side.
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
