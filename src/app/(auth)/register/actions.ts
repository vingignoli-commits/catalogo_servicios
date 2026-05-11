"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getDashboardPathByRole } from "@/lib/auth/role-redirect";

const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  email: z.string().email("Email inválido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
  role: z.enum(["PROFESSIONAL", "CLIENT"]),
});

export async function registerAction(formData: FormData) {
  const rawData = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? "").toLowerCase().trim(),
    password: String(formData.get("password") ?? ""),
    role: String(formData.get("role") ?? "CLIENT"),
  };

  const parsed = registerSchema.safeParse(rawData);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    redirect(`/register?error=${encodeURIComponent(message)}`);
  }

  const { name, email, password, role } = parsed.data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    redirect(
      `/register?error=${encodeURIComponent("Ya existe un usuario con ese email.")}`
    );
  }

  const supabaseAdmin = createSupabaseAdminClient();

  const { data: createdUserData, error: createUserError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role,
      },
    });

  if (createUserError || !createdUserData.user) {
    redirect(
      `/register?error=${encodeURIComponent(
        createUserError?.message ?? "No se pudo crear el usuario."
      )}`
    );
  }

  const appUser = await prisma.user.create({
    data: {
      id: createdUserData.user.id,
      email,
      name,
      role,
      clientProfile: role === "CLIENT" ? { create: {} } : undefined,
      professionalProfile:
        role === "PROFESSIONAL" ? { create: {} } : undefined,
    },
  });

  const supabase = await createSupabaseServerClient();

  const { error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (loginError) {
    redirect(
      `/login?error=${encodeURIComponent(
        "Usuario creado. Iniciá sesión manualmente."
      )}`
    );
  }

  revalidatePath("/");

  redirect(getDashboardPathByRole(appUser.role));
}