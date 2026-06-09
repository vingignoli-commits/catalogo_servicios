import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// ─── Constantes (duplicadas del app-session para evitar importar Node crypto) ──
// El middleware corre en Edge Runtime, donde `import crypto from "crypto"` y
// `Buffer` NO están disponibles. Usamos la Web Crypto API nativa del browser/edge.

const APP_SESSION_COOKIE = "turnopro_user_session";

function getSessionSecret(): string {
  return (
    process.env.APP_SESSION_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
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
    const secret = getSessionSecret();
    const encoder = new TextEncoder();

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

    // Convertir la firma esperada a hex para comparar con lo que tenemos
    const expectedHex = Array.from(new Uint8Array(expectedBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Comparación en tiempo constante (evita timing attacks)
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
  // ── 1. Verificar APP_SESSION_COOKIE con Web Crypto API (compatible Edge) ───
  const appSessionToken = request.cookies.get(APP_SESSION_COOKIE)?.value;

  if (appSessionToken) {
    const isValid = await verifyAppSessionToken(appSessionToken);
    if (isValid) {
      // Sesión propia válida → dejar pasar sin tocar nada más.
      return NextResponse.next({ request });
    }
  }

  // ── 2. Sin APP_SESSION_COOKIE válido, verificar sesión de Supabase ─────────
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
          // Escribir cookies en el request (para Server Components) y en la response.
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
