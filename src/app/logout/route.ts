import { NextResponse, type NextRequest } from "next/server";

import { APP_SESSION_COOKIE } from "@/lib/auth/app-session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  await supabase.auth.signOut();

  const response = NextResponse.redirect(new URL("/login", request.url));

  response.cookies.delete(APP_SESSION_COOKIE);

  return response;
}
