import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser();

  if (error || !authUser?.email) {
    return null;
  }

  const appUser = await prisma.user.findUnique({
    where: {
      email: authUser.email,
    },
  });

  if (!appUser) {
    return null;
  }

  return appUser;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.status === "SUSPENDED") {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();

    redirect("/login?error=Tu%20cuenta%20est%C3%A1%20suspendida.");
  }

  return user;
}

export async function requireRole(allowedRoles: Role[]) {
  const user = await requireUser();

  if (!allowedRoles.includes(user.role)) {
    redirect("/");
  }

  return user;
}