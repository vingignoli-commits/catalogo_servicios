import type { Role } from "@prisma/client";

export function getDashboardPathByRole(role: Role) {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "PROFESSIONAL":
      return "/professional";
    case "CLIENT":
    default:
      return "/client";
  }
}