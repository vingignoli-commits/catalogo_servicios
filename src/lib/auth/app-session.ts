import crypto from "crypto";

export const APP_SESSION_COOKIE = "turnopro_user_session";

// ⚠️  IMPORTANTE — consistencia entre Node y Edge Runtime:
// Este módulo corre en Node.js (Route Handlers, Server Components).
// El middleware corre en Edge Runtime donde SUPABASE_SERVICE_ROLE_KEY
// NO está disponible. Por eso AMBOS deben usar el mismo secreto:
//   1. Si tenés APP_SESSION_SECRET en .env → perfecto, es el valor usado.
//   2. Si no, ambos caen a NEXT_PUBLIC_SUPABASE_ANON_KEY.
//
// NO usar SUPABASE_SERVICE_ROLE_KEY como fallback acá porque rompería
// la verificación en el middleware (Edge no lo ve).
function getSessionSecret() {
  return (
    process.env.APP_SESSION_SECRET ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "local-dev-secret"
  );
}

export function createAppSessionToken(userId: string) {
  const signature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(userId)
    .digest("hex");

  return `${userId}.${signature}`;
}

export function readUserIdFromAppSessionToken(token?: string) {
  if (!token) return null;

  // Usar lastIndexOf en lugar de split(".") para ser consistente con
  // el parsing del middleware.
  const dotIndex = token.lastIndexOf(".");
  if (dotIndex === -1) return null;

  const userId = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);

  if (!userId || !signature) return null;

  const expectedSignature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(userId)
    .digest("hex");

  const provided = Buffer.from(signature, "hex");
  const expected = Buffer.from(expectedSignature, "hex");

  if (provided.length !== expected.length) return null;

  return crypto.timingSafeEqual(provided, expected) ? userId : null;
}
