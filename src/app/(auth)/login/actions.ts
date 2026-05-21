"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getRedirectPath(role: string) {
  if (role === "ADMIN") return "/admin";
  if (role === "PROFESSIONAL") return "/professional";
  return "/client";
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=Complet%C3%A1%20email%20y%20contrase%C3%B1a.");
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    redirect("/login?error=Credenciales%20inv%C3%A1lidas.");
  }

  const appUser = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      role: true,
      status: true,
    },
  });

  if (!appUser) {
    redirect("/login?error=Usuario%20sin%20perfil%20interno.");
  }

  if (appUser.status === "SUSPENDED") {
    await supabase.auth.signOut();

    redirect("/login?error=Tu%20cuenta%20est%C3%A1%20suspendida.");
  }

  redirect(getRedirectPath(appUser.role));
}