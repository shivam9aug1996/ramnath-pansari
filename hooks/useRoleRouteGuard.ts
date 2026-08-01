import { useEffect } from "react";
import { Platform } from "react-native";
import { router, usePathname } from "expo-router";
import { useSelector } from "react-redux";
import { RootState } from "@/types/global";
import { AppRole, getAppHomeRoute, getAppRole } from "@/utils/authRoles";
import { isAnyRefreshPersistPath } from "@/utils/refreshPersistPaths";

/** Redirect users away from routes that do not match their role. */
export function useRoleRouteGuard(allowedRole: Exclude<AppRole, "unauthenticated">) {
  const pathname = usePathname();
  const token = useSelector((state: RootState) => state.auth?.token);
  const userData = useSelector((state: RootState) => state.auth?.userData);
  const loadAuthData = useSelector(
    (state: RootState) => state.auth?.loadAuthData,
  );
  const authReady =
    Boolean(loadAuthData?.isSuccess) || Boolean(loadAuthData?.isError);

  const role = getAppRole(userData, token);

  useEffect(() => {
    if (!authReady) return;

    const livePath =
      Platform.OS === "web" && typeof window !== "undefined"
        ? window.location.pathname || pathname
        : pathname;

    // /terms & /privacy also exist under (private); don't bounce unauthenticated
    // users to /login on refresh — AuthenticationFlow owns those paths.
    if (isAnyRefreshPersistPath(livePath)) return;

    if (role === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (role !== allowedRole) {
      router.replace(getAppHomeRoute(userData, token));
    }
  }, [allowedRole, role, token, userData, authReady, pathname]);
}
