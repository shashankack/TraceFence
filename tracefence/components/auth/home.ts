import type { AuthMeDTO } from "@/components/api/types";

/** Built-in role home paths. Prefer homeFor(user) when customRoles may apply. */
export const HOME: Record<string, string> = {
  guest: "/student",
  student: "/student",
  faculty: "/faculty",
  admin: "/admin",
};

/** Where a principal lands after sign-in (respects org-defined roles). */
export function homeFor(user: Pick<AuthMeDTO, "role" | "customRoles">): string {
  if (HOME[user.role]) return HOME[user.role];
  const custom = user.customRoles?.find((c) => c.id === user.role);
  return custom?.workspace === "faculty" ? "/faculty" : "/student";
}

export function workspaceFor(
  user: Pick<AuthMeDTO, "role" | "customRoles">,
): "student" | "faculty" | "admin" {
  if (user.role === "admin") return "admin";
  if (user.role === "faculty") return "faculty";
  if (user.role === "guest" || user.role === "student") return "student";
  const custom = user.customRoles?.find((c) => c.id === user.role);
  return custom?.workspace === "faculty" ? "faculty" : "student";
}
