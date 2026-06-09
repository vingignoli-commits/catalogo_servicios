import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/lib/db/prisma";
import { getDashboardPath } from "@/lib/auth/role-redirect";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  if (!email || !password) {
    return NextResponse.redirect(new URL("/login?error=Completá+email+y+contraseña", request.url));
  }

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

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user?.email) {
    return NextResponse.redirect(new URL("/login?error=Credenciales+inválidas", request.url));
  }

  const user = await prisma.user.findUnique({
    where: { email: data.user.email.toLowerCase() },
    select: { role: true, status: true },
  });

  if (!user || user.status === "SUSPENDED") {
    await supabase.auth.signOut();
    const msg = !user ? "Usuario+sin+perfil" : "Cuenta+suspendida";
    return NextResponse.redirect(new URL(`/login?error=${msg}`, request.url));
  }

  const res = NextResponse.redirect(new URL(getDashboardPath(user.role), request.url));
  collected.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
