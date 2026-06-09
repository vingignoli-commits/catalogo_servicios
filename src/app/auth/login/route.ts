import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { prisma } from "@/lib/db/prisma";
import { getDashboardPathByRole } from "@/lib/auth/role-redirect";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return NextResponse.redirect(
      new URL("/login?error=Complet%C3%A1%20email%20y%20contrase%C3%B1a.", request.url)
    );
  }

  const cookiesToSet: { name: string; value: string; options: Parameters<NextResponse["cookies"]["set"]>[2] }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(items) {
          items.forEach(({ name, value, options }) => cookiesToSet.push({ name, value, options }));
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user?.email) {
    return NextResponse.redirect(
      new URL("/login?error=Credenciales%20inv%C3%A1lidas.", request.url)
    );
  }

  const appUser = await prisma.user.findUnique({
    where: { email: data.user.email.toLowerCase() },
    select: { id: true, role: true, status: true },
  });

  if (!appUser) {
    await supabase.auth.signOut();
    const res = NextResponse.redirect(new URL("/login?error=Usuario%20sin%20perfil%20interno.", request.url));
    cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  }

  if (appUser.status === "SUSPENDED") {
    await supabase.auth.signOut();
    const res = NextResponse.redirect(new URL("/login?error=Tu%20cuenta%20est%C3%A1%20suspendida.", request.url));
    cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  }

  const res = NextResponse.redirect(new URL(getDashboardPathByRole(appUser.role), request.url));
  cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
