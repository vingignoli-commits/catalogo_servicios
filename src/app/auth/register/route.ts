import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getDashboardPathByRole } from "@/lib/auth/role-redirect";
import {
  APP_SESSION_COOKIE,
  createAppSessionToken,
} from "@/lib/auth/app-session";

type CookieToSet = {
  name: string;
  value: string;
  options: Parameters<NextResponse["cookies"]["set"]>[2];
};

const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  email: z.string().email("Email inválido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
  role: z.enum(["PROFESSIONAL", "CLIENT"]),
});

function redirectWithCookies({
  request,
  path,
  cookiesToSet,
  appUserId,
}: {
  request: NextRequest;
  path: string;
  cookiesToSet: CookieToSet[];
  appUserId?: string;
}) {
  const response = NextResponse.redirect(new URL(path, request.url));

  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  if (appUserId) {
    response.cookies.set(APP_SESSION_COOKIE, createAppSessionToken(appUserId), {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return response;
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const parsed = registerSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? "").toLowerCase().trim(),
    password: String(formData.get("password") ?? ""),
    role: String(formData.get("role") ?? "CLIENT"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Datos inválidos.";

    return NextResponse.redirect(
      new URL(`/register?error=${encodeURIComponent(message)}`, request.url)
    );
  }

  const { name, email, password, role } = parsed.data;

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    return NextResponse.redirect(
      new URL(
        `/register?error=${encodeURIComponent(
          "Ya existe un usuario con ese email."
        )}`,
        request.url
      )
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
    return NextResponse.redirect(
      new URL(
        `/register?error=${encodeURIComponent(
          createUserError?.message ?? "No se pudo crear el usuario."
        )}`,
        request.url
      )
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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return redirectWithCookies({
      request,
      path: getDashboardPathByRole(appUser.role),
      cookiesToSet: [],
      appUserId: appUser.id,
    });
  }

  const cookiesToSet: CookieToSet[] = [];

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },

      setAll(items) {
        items.forEach(({ name, value, options }) => {
          cookiesToSet.push({
            name,
            value,
            options,
          });
        });
      },
    },
  });

  await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return redirectWithCookies({
    request,
    path: getDashboardPathByRole(appUser.role),
    cookiesToSet,
    appUserId: appUser.id,
  });
}
