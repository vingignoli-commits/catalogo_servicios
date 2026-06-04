"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function forgotPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    redirect("/forgot-password?error=Ingres%C3%A1%20tu%20email.");
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL;

  if (!origin) {
    redirect(
      "/forgot-password?error=Falta%20configurar%20NEXT_PUBLIC_SITE_URL."
    );
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect(
    "/forgot-password?success=Si%20el%20email%20existe%2C%20vas%20a%20recibir%20un%20enlace%20para%20recuperar%20tu%20contrase%C3%B1a."
  );
}
