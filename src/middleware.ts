import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// ─── Verificación del APP_SESSION_COOKIE ──────────────────────────────────────
// El middleware corre en Edge Runtime. Las variables de entorno server-only como
// SUPABASE_SERVICE_ROLE_KEY NO están disponibles en Edge.
// El secreto usado aquí DEBE ser el mismo que en lib/auth/app-session.ts
// en el momento de crear el token. Ambos usan NEXT_PUBLIC_SUPABASE_ANON_KEY
// como fallback, pero si el Route Handler tiene SUPABASE_SERVICE_ROLE_KEY
// disponible (Node runtime), el secreto cambia entre creación y verificación.
//
// Solución: fijar el secreto a NEXT_PUBLIC_SUPABASE_ANON_KEY en el middleware
// (la única variable garantizada en Edge), y en lib/auth/app-session.ts
// hacer lo mismo para que sean consistentes.
// Lo ideal es setear APP_SESSION_SECRET en .env para que ambos lo usen.

const APP_SESSION_COOKIE = "turnopro_user_session";

function getEdgeSessionSecret(): string {
  // En Edge Runtime sólo están disponibles NEXT_PUBLIC_* y APP_SESSION_SECRET.
  // NUNCA usar SUPABASE_SERVICE_ROLE_KEY acá (no existe en Edge).
  return (
    process.env.APP_SESSION_SECRET ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "local-dev-secret"
  );
}

async function verifyAppSessionToken(token: string): Promise<boolean> {
  const dotIndex = token.lastIndexOf(".");
  if (dotIndex === -1) return false;

  const userId = token.slice(0, dotIndex);
  const signatureHex = token.slice(dotIndex + 1);

  if (!userId || !signatureHex) return false;

  try {
    const encoder = new TextEncoder();
    const secret = getEdgeSessionSecret();

    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const expectedBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(userId)
    );

    const expectedHex = Array.from(new Uint8Array(expectedBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (expectedHex.length !== signatureHex.length) return false;

    let diff = 0;
    for (let i = 0; i < expectedHex.length; i++) {
      diff |= expectedHex.charCodeAt(i) ^ signatureHex.charCodeAt(i);
    }

    return diff === 0;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  // ── 1. Verificar APP_SESSION_COOKIE ────────────────────────────────────────
  const appSessionToken = request.cookies.get(APP_SESSION_COOKIE)?.value;

  if (appSessionToken) {
    const isValid = await verifyAppSessionToken(appSessionToken);
    if (isValid) {
      return NextResponse.next({ request });
    }
  }

  // ── 2. Fallback: verificar sesión Supabase y refrescar cookies ─────────────
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
