export function getDashboardPath(role: string) {
  if (role === "ADMIN") return "/admin";
  if (role === "PROFESSIONAL") return "/professional";
  return "/client";
}
