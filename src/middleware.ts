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
          // Escribir en el request para que el Server Component los vea
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Reconstruir response con el request actualizado
          response = NextResponse.next({ request });
          // Escribir en la response para que el browser los reciba
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  const isProtectedRoute =
    path.startsWith("/admin") ||
    path.startsWith("/client") ||
    path.startsWith("/professional");

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Rutas protegidas: bloquean si no hay sesión
    "/admin/:path*",
    "/client/:path*",
    "/professional/:path*",
    // Rutas públicas que necesitan que las cookies estén frescas
    // para que getCurrentUser() funcione en el Server Component
    "/professionals/:path*",
  ],
};
