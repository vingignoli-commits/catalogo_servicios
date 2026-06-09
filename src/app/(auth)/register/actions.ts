"use server";

// Este Server Action ya no se usa directamente desde la página de registro
// (la página apunta al Route Handler /auth/register con method="POST").
//
// Los Server Actions NO pueden setear cookies de sesión de Supabase de forma
// confiable cuando terminan con redirect(), por eso el flujo de auth usa
// Route Handlers (src/app/auth/login/route.ts y src/app/auth/register/route.ts).
//
// Este archivo se mantiene para evitar errores de importación si existe alguna
// referencia externa, pero NO debe usarse para flujos de autenticación.

import { redirect } from "next/navigation";

export async function registerAction(_formData: FormData) {
  // Derivar al Route Handler correcto.
  redirect("/register");
}
