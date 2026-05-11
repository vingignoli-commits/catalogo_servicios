import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type AppButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "dark";
type AppButtonSize = "sm" | "md" | "lg";

type BaseProps = {
  children: ReactNode;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  className?: string;
};

type ButtonProps = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never;
  };

type LinkProps = BaseProps & {
  href: string;
  type?: never;
  disabled?: never;
  onClick?: never;
};

type AppButtonProps = ButtonProps | LinkProps;

function getVariantClassName(variant: AppButtonVariant) {
  const variants: Record<AppButtonVariant, string> = {
    primary:
      "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700",
    secondary:
      "border border-slate-200 bg-white text-slate-800 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700",
    danger:
      "border border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100",
    ghost:
      "bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900",
    dark:
      "border border-slate-700 bg-slate-900 text-white hover:border-blue-500 hover:bg-slate-800",
  };

  return variants[variant];
}

function getSizeClassName(size: AppButtonSize) {
  const sizes: Record<AppButtonSize, string> = {
    sm: "px-3 py-2 text-xs",
    md: "px-5 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };

  return sizes[size];
}

export function AppButton({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: AppButtonProps) {
  const baseClassName = [
    "inline-flex items-center justify-center rounded-xl font-bold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
    getVariantClassName(variant),
    getSizeClassName(size),
    className,
  ].join(" ");

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={baseClassName}>
        {children}
      </Link>
    );
  }

  return (
    <button className={baseClassName} {...props}>
      {children}
    </button>
  );
}