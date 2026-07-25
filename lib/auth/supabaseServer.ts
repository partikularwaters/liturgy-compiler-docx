import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cookie-backed Supabase client for Server Components/Actions -- distinct
// from lib/db/supabase.ts's service-role client (which bypasses RLS by
// design and is used for every existing trusted server-side write). This
// client carries the actual signed-in user's session, so auth.uid() inside
// RLS policies resolves to a real person instead of nothing.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component that can't set cookies -- safe
            // to ignore as long as middleware.ts is refreshing the session.
          }
        },
      },
    }
  );
}
