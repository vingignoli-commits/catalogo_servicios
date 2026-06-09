import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

export type Role = "ADMIN" | "PROFESSIONAL" | "CLIENT";

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();

  // getUser() valida contra Supabase Auth server — más seguro pero requiere red
  // Si falla, usamos getSession() que lee desde la cookie local
  let email: string | null = null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    email = user?.email ?? null;
  } catch {
    const { data: { session } } = await supabase.auth.getSession();
    email = session?.user?.email ?? null;
  }

  if (!email) return null;

  return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.status === "SUSPENDED") redirect("/login?error=Cuenta+suspendida");
  return user;
}

export async function requireRole(roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role as Role)) redirect("/");
  return user;
}
