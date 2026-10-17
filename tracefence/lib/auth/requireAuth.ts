import type { CampusRole } from "../security/types";
import { bearerTokenFromRequest, resolveAuthToken } from "./session";
import type { AuthContext } from "./types";

export function requireAuth(
  req: Request,
): { ok: true; auth: AuthContext } | { ok: false; status: number; error: string } {
  const token = bearerTokenFromRequest(req);
  if (!token) {
    return {
      ok: false,
      status: 401,
      error: "Missing Authorization: Bearer <token>",
    };
  }
  const auth = resolveAuthToken(token);
  if (!auth) {
    return { ok: false, status: 401, error: "Invalid or expired auth session" };
  }
  return { ok: true, auth };
}

export function requireRole(
  req: Request,
  roles: CampusRole[],
): { ok: true; auth: AuthContext } | { ok: false; status: number; error: string } {
  const base = requireAuth(req);
  if (!base.ok) return base;
  if (!roles.includes(base.auth.role)) {
    return {
      ok: false,
      status: 403,
      error: `Requires role: ${roles.join(" | ")}`,
    };
  }
  return base;
}

export function requireAdmin(req: Request) {
  return requireRole(req, ["admin"]);
}
