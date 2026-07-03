import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Call at the top of every API route handler.
 * Returns { user, supabase } if authenticated, or a 401 response.
 *
 * Usage in any /api route:
 *   const auth = await requireUser();
 *   if (auth instanceof NextResponse) return auth; // 401
 *   const { user, supabase } = auth;
 */
export async function requireUser() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() { /* API routes don't need to set cookies */ },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return { user, supabase };
}
