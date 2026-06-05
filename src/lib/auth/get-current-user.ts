import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  APP_SESSION_COOKIE,
  readUserIdFromAppSessionToken,
} from "@/lib/auth/app-session";

type Role = "ADMIN" | "PROFESSIONAL" | "CLIENT";

async function getUserFromAppSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(APP_SESSION_COOKIE)?.value;
  const userId = readUserIdFromAppSessionToken(token);

  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
}

export async function getCurrentUser() {
  const appSessionUser = await getUserFromAppSession();

  if (appSessionUser) {
    return appSessionUser;
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser?.email) {
    return null;
  }

  return prisma.user.findUnique({
    where: {
      email: authUser.email.toLowerCase(),
    },
  });
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.status === "SUSPENDED") {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();

    const cookieStore = await cookies();
    cookieStore.delete(APP_SESSION_COOKIE);

    redirect("/login?error=Tu%20cuenta%20est%C3%A1%20suspendida.");
  }

  return user;
}

export async function requireRole(allowedRoles: Role[]) {
  const user = await requireUser();

  if (!allowedRoles.includes(user.role as Role)) {
    redirect("/");
  }

  return user;
}
