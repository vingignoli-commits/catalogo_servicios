import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { prisma } from "@/lib/db/prisma";
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

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return NextResponse.redirect(
      new URL(
        "/login?error=Complet%C3%A1%20email%20y%20contrase%C3%B1a.",
        request.url
      )
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(
      new URL(
        "/login?error=Faltan%20variables%20de%20Supabase.",
        request.url
      )
    );
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

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user?.email) {
    return NextResponse.redirect(
      new URL("/login?error=Credenciales%20inv%C3%A1lidas.", request.url)
    );
  }

  const appUser = await prisma.user.findUnique({
    where: {
      email: data.user.email.toLowerCase(),
    },
    select: {
      id: true,
      role: true,
      status: true,
    },
  });

  if (!appUser) {
    await supabase.auth.signOut();

    return redirectWithCookies({
      request,
      path: "/login?error=Usuario%20sin%20perfil%20interno.",
      cookiesToSet,
    });
  }

  if (appUser.status === "SUSPENDED") {
    await supabase.auth.signOut();

    return redirectWithCookies({
      request,
      path: "/login?error=Tu%20cuenta%20est%C3%A1%20suspendida.",
      cookiesToSet,
    });
  }

  return redirectWithCookies({
    request,
    path: getDashboardPathByRole(appUser.role),
    cookiesToSet,
    appUserId: appUser.id,
  });
}
