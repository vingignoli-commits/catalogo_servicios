import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Role = "ADMIN" | "PROFESSIONAL" | "CLIENT";

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser?.email) return null;

  return prisma.user.findUnique({
    where: { email: authUser.email.toLowerCase() },
  });
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  if (user.status === "SUSPENDED") {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    redirect("/login?error=Tu%20cuenta%20est%C3%A1%20suspendida.");
  }

  return user;
}

export async function requireRole(allowedRoles: Role[]) {
  const user = await requireUser();
  if (!allowedRoles.includes(user.role as Role)) redirect("/");
  return user;
}
