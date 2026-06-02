"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function resetPasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password.length < 8) {
    redirect(
      "/reset-password?error=La%20contrase%C3%B1a%20debe%20tener%20al%20menos%208%20caracteres."
    );
  }

  if (password !== confirmPassword) {
    redirect(
      "/reset-password?error=Las%20contrase%C3%B1as%20no%20coinciden."
    );
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    redirect(
      `/reset-password?error=${encodeURIComponent(error.message)}`
    );
  }

  redirect(
    "/login?error=Contrase%C3%B1a%20actualizada.%20Ingres%C3%A1%20con%20tu%20nueva%20contrase%C3%B1a."
  );
}
