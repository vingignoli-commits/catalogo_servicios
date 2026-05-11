import type { ReactNode } from "react";

type AppCardVariant = "light" | "dark";

type AppCardProps = {
  children: ReactNode;
  variant?: AppCardVariant;
  className?: string;
};

export function AppCard({
  children,
  variant = "light",
  className = "",
}: AppCardProps) {
  const variantClassName =
    variant === "dark"
      ? "border-slate-800 bg-slate-900 text-white"
      : "border-slate-200 bg-white text-slate-950 shadow-sm";

  return (
    <section
      className={[
        "rounded-2xl border p-6 transition-all",
        variantClassName,
        className,
      ].join(" ")}
    >
      {children}
    </section>
  );
}