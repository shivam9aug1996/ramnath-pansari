import { useEffect } from "react";
import { router } from "expo-router";
import { useSelector } from "react-redux";
import { RootState } from "@/types/global";
import { AppRole, getAppHomeRoute, getAppRole } from "@/utils/authRoles";

/** Redirect users away from routes that do not match their role. */
export function useRoleRouteGuard(allowedRole: Exclude<AppRole, "unauthenticated">) {
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
    
    if (role === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (role !== allowedRole) {
      router.replace(getAppHomeRoute(userData, token));
    }
  }, [allowedRole, role, token, userData, authReady]);
}
