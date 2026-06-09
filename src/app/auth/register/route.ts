import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getDashboardPath } from "@/lib/auth/role-redirect";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["CLIENT", "PROFESSIONAL"]),
});

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const parsed = schema.safeParse({
    name: String(form.get("name") ?? ""),
    email: String(form.get("email") ?? "").toLowerCase().trim(),
    password: String(form.get("password") ?? ""),
    role: String(form.get("role") ?? "CLIENT"),
  });

  if (!parsed.success) {
    const msg = encodeURIComponent(parsed.error.issues[0]?.message ?? "Datos inválidos");
    return NextResponse.redirect(new URL(`/register?error=${msg}`, request.url));
  }

  const { name, email, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.redirect(new URL("/register?error=Email+ya+registrado", request.url));
  }

  const admin = createSupabaseAdminClient();
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { name, role },
  });

  if (createErr || !created.user) {
    const msg = encodeURIComponent(createErr?.message ?? "Error al crear usuario");
    return NextResponse.redirect(new URL(`/register?error=${msg}`, request.url));
  }

  const appUser = await prisma.user.create({
    data: {
      id: created.user.id, email, name, role,
      clientProfile: role === "CLIENT" ? { create: {} } : undefined,
      professionalProfile: role === "PROFESSIONAL" ? { create: {} } : undefined,
    },
  });

  // Auto-login después del registro
  const collected: { name: string; value: string; options: Parameters<NextResponse["cookies"]["set"]>[2] }[] = [];
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (items) => items.forEach(({ name, value, options }) => collected.push({ name, value, options })),
      },
    }
  );

  await supabase.auth.signInWithPassword({ email, password });

  const res = NextResponse.redirect(new URL(getDashboardPath(appUser.role), request.url));
  collected.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
