"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDashboardPathByRole } from "@/lib/auth/role-redirect";

const loginSchema = z.object({
  email: z.string().email("Email inválido."),
  password: z.string().min(1, "La contraseña es obligatoria."),
});

export async function loginAction(formData: FormData) {
  const rawData = {
    email: String(formData.get("email") ?? "").toLowerCase().trim(),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = loginSchema.safeParse(rawData);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    redirect(`/login?error=${encodeURIComponent(message)}`);
  }

  const { email, password } = parsed.data;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user?.email) {
    redirect(
      `/login?error=${encodeURIComponent(
        "Credenciales inválidas o usuario no confirmado."
      )}`
    );
  }

  const appUser = await prisma.user.findUnique({
    where: {
      email: data.user.email,
    },
  });

  if (!appUser) {
    redirect(
      `/login?error=${encodeURIComponent(
        "El usuario existe en Supabase pero no en la base interna."
      )}`
    );
  }

  if (appUser.status === "SUSPENDED") {
    redirect(
      `/login?error=${encodeURIComponent("Tu cuenta está suspendida.")}`
    );
  }

  redirect(getDashboardPathByRole(appUser.role));
}