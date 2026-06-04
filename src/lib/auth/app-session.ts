import crypto from "crypto";

export const APP_SESSION_COOKIE = "turnopro_user_session";

function getSessionSecret() {
  return (
    process.env.APP_SESSION_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
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

  const [userId, signature] = token.split(".");

  if (!userId || !signature) return null;

  const expectedSignature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(userId)
    .digest("hex");

  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (provided.length !== expected.length) return null;

  const isValid = crypto.timingSafeEqual(provided, expected);

  return isValid ? userId : null;
}
