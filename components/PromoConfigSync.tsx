import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/types/global";
import { syncAppState } from "@/utils/syncAppState";
import { loadRecentSearch } from "@/utils/recentSearchConfigCache";

/** Syncs global configs; loads recent search separately for the current user. */
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
    loadRecentSearch(dispatch, userId, { isGuestUser }).catch(() => {});
  }, [dispatch, token, userId, isAdminUser, isDriverUser, isGuestUser]);

  return null;
}
