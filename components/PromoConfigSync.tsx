import { useEffect } from "react";
import { AppState } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/types/global";
import { syncAppState } from "@/utils/syncAppState";

/** Runs sync-state on mount and foreground; fetches only stale resources. */
export default function PromoConfigSync() {
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth?.token);
  const userId = useSelector((state: RootState) => state.auth?.userData?._id);
  const isAdminUser = useSelector(
    (state: RootState) => state.auth?.userData?.isAdminUser,
  );
  const isDriverUser = useSelector(
    (state: RootState) => state.auth?.userData?.isDriverUser,
  );
  const isGuestUser = useSelector(
    (state: RootState) => state.auth?.userData?.isGuestUser,
  );

  useEffect(() => {
    if (!userId || isAdminUser || isDriverUser) return;
    syncAppState(dispatch, { token, userId, isGuestUser }).catch(() => {});
  }, [dispatch, token, userId, isAdminUser, isDriverUser, isGuestUser]);

  useEffect(() => {
    if (!userId || isAdminUser || isDriverUser) return;

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        syncAppState(dispatch, { token, userId, isGuestUser }).catch(() => {});
      }
    });

    return () => subscription.remove();
  }, [dispatch, token, userId, isAdminUser, isDriverUser, isGuestUser]);

  return null;
}
