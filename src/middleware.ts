import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

import {
  APP_SESSION_COOKIE,
  readUserIdFromAppSessionToken,
} from "@/lib/auth/app-session";

export async function middleware(request: NextRequest) {
  // ── 1. Si hay un APP_SESSION_COOKIE válido, la sesión está activa ──────────
  const appSessionToken = request.cookies.get(APP_SESSION_COOKIE)?.value;
  const appUserId = readUserIdFromAppSessionToken(appSessionToken);

  if (appUserId) {
    // Sesión propia válida → dejar pasar sin tocar nada más.
    return NextResponse.next({ request });
  }

  // ── 2. Sin APP_SESSION_COOKIE, intentar con sesión de Supabase ─────────────
  // Hay que construir la respuesta ANTES de crear el cliente para poder
  // escribir las cookies de refresco sobre ella.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Primero ponemos las cookies en el objeto request (para que el
          // Server Component que venga después las vea).
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Luego las incluimos en la respuesta que llegará al browser.
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/client/:path*", "/professional/:path*"],
};
