import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Siempre llamar getUser() para que Supabase refresque el token si hace falta.
  // Esto es lo que escribe las cookies actualizadas en la response.
  const { data: { user } } = await supabase.auth.getUser();

  const isProtectedRoute = request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/client") ||
    request.nextUrl.pathname.startsWith("/professional");

  // Solo bloquear en rutas protegidas. En rutas públicas (professionals/*/slots/confirm)
  // solo refrescamos cookies y dejamos pasar — la página se encarga de redirigir si hace falta.
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Incluir las rutas públicas que necesitan sesión (para refrescar cookies),
  // además de las rutas protegidas que bloquean si no hay usuario.
  matcher: [
    "/admin/:path*",
    "/client/:path*",
    "/professional/:path*",
    "/professionals/:id/slots/confirm",
  ],
};
