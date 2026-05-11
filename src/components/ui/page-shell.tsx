import type { ReactNode } from "react";
import Link from "next/link";

import { AppButton } from "@/components/ui/app-button";

type PageShellVariant = "public" | "dashboard";

type PageShellProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  variant?: PageShellVariant;
  backHref?: string;
  backLabel?: string;
  actionHref?: string;
  actionLabel?: string;
};

export function PageShell({
  children,
  title,
  subtitle,
  eyebrow,
  variant = "dashboard",
  backHref,
  backLabel = "Volver",
  actionHref,
  actionLabel,
}: PageShellProps) {
  const isDashboard = variant === "dashboard";

  return (
    <main
      className={
        isDashboard
          ? "min-h-screen bg-slate-950 px-6 py-10 text-white"
          : "min-h-screen bg-white px-6 py-10 text-slate-950"
      }
    >
      <section className="mx-auto max-w-6xl">
        {(title || backHref || actionHref) && (
          <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              {backHref ? (
                <Link
                  href={backHref}
                  className={
                    isDashboard
                      ? "mb-4 inline-block text-sm text-slate-400 hover:text-white"
                      : "mb-4 inline-block text-sm text-slate-500 hover:text-blue-600"
                  }
                >
                  ← {backLabel}
                </Link>
              ) : null}

              {eyebrow ? (
                <p
                  className={
                    isDashboard
                      ? "text-sm font-medium uppercase tracking-wide text-blue-400"
                      : "text-sm font-medium uppercase tracking-wide text-blue-600"
                  }
                >
                  {eyebrow}
                </p>
              ) : null}

              {title ? (
                <h1
                  className={
                    isDashboard
                      ? "mt-3 text-3xl font-bold text-white"
                      : "mt-3 text-4xl font-extrabold text-slate-950"
                  }
                >
                  {title}
                </h1>
              ) : null}

              {subtitle ? (
                <p
                  className={
                    isDashboard
                      ? "mt-2 max-w-2xl text-slate-300"
                      : "mt-2 max-w-2xl text-slate-500"
                  }
                >
                  {subtitle}
                </p>
              ) : null}
            </div>

            {actionHref && actionLabel ? (
              <AppButton href={actionHref} variant={isDashboard ? "primary" : "primary"}>
                {actionLabel}
              </AppButton>
            ) : null}
          </header>
        )}

        {children}
      </section>
    </main>
  );
}