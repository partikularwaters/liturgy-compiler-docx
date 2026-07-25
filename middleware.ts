import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refreshes the Supabase session cookie on every request -- without this,
// a signed-in user's session silently expires mid-visit (the standard
// Supabase + Next.js App Router pattern; Server Components can't write
// cookies on their own, only middleware and Route Handlers can).
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  // NEXT_PUBLIC_SUPABASE_ANON_KEY isn't provisioned in this environment yet
  // (the RBAC work depends on it, see lib/auth/getCurrentUser.ts's same
  // guard) -- every other route must keep working with everyone treated as
  // anonymous/read-only in the meantime, not crash on every request.
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
