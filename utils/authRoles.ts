import {
  ADMIN_LOGIN_MOBILE,
  DRIVER_LOGIN_MOBILE,
} from "@/constants/AuthLogin";

type AuthUser = {
  mobileNumber?: string | null;
  isAdminUser?: boolean;
  isDriverUser?: boolean;
} | null | undefined;

export type AppRole = "admin" | "driver" | "customer" | "unauthenticated";

export function resolveIsAdminUser(user: AuthUser) {
  return Boolean(
    user?.isAdminUser || user?.mobileNumber === ADMIN_LOGIN_MOBILE,
  );
}

export function resolveIsDriverUser(user: AuthUser) {
  return Boolean(
    user?.isDriverUser || user?.mobileNumber === DRIVER_LOGIN_MOBILE,
  );
}

export function getAppRole(
  user: AuthUser,
  token: string | null | undefined,
): AppRole {
  if (!token) return "unauthenticated";
  if (resolveIsAdminUser(user)) return "admin";
  if (resolveIsDriverUser(user)) return "driver";
  return "customer";
}

export function getAppHomeRoute(
  user: AuthUser,
  token: string | null | undefined,
): "/admin/home" | "/driver/home" | "/(private)/(tabs)/home" | "/login" {
  const role = getAppRole(user, token);
  if (role === "admin") return "/admin/home";
  if (role === "driver") return "/driver/home";
  if (role === "customer") return "/(private)/(tabs)/home";
  return "/login";
}
