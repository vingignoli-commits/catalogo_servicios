type StatusBadgeProps = {
  status: string;
};

const statusConfig: Record<
  string,
  {
    label: string;
    className: string;
  }
> = {
  REQUESTED: {
    label: "Solicitado",
    className:
      "border border-amber-300 bg-amber-100 text-amber-900",
  },

  ACCEPTED: {
    label: "Aceptado",
    className:
      "border border-blue-300 bg-blue-100 text-blue-900",
  },

  REJECTED: {
    label: "Rechazado",
    className:
      "border border-red-300 bg-red-100 text-red-900",
  },

  CANCELLED_BY_CLIENT: {
    label: "Cancelado por cliente",
    className:
      "border border-slate-300 bg-slate-200 text-slate-900",
  },

  CANCELLED_BY_PROFESSIONAL: {
    label: "Cancelado por profesional",
    className:
      "border border-slate-300 bg-slate-200 text-slate-900",
  },

  COMPLETED: {
    label: "Completado",
    className:
      "border border-emerald-300 bg-emerald-100 text-emerald-900",
  },

  NO_SHOW: {
    label: "Ausente",
    className:
      "border border-fuchsia-300 bg-fuchsia-100 text-fuchsia-900",
  },

  EXPIRED: {
    label: "Expirado",
    className:
      "border border-slate-300 bg-slate-200 text-slate-900",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    className:
      "border border-slate-300 bg-slate-100 text-slate-900",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${config.className}`}
    >
      {config.label}
    </span>
  );
}