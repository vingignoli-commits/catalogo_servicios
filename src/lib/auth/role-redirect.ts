type Role = "ADMIN" | "PROFESSIONAL" | "CLIENT";

export function getDashboardPathByRole(role: Role) {
  switch (role) {
    case "ADMIN":
      return "/admin";

    case "PROFESSIONAL":
      return "/professional";

    case "CLIENT":
      return "/client";

    default:
      return "/";
  }
}
