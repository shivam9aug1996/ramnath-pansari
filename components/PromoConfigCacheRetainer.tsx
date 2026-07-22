// components/PromoConfigCacheRetainer.tsx
import { useSelector } from "react-redux";
import { useFetchOffersQuery } from "@/redux/features/offerSlice";
import { useFetchDeliverySettingsQuery } from "@/redux/features/deliverySettingsSlice";
import { useFetchStoreConfigQuery } from "@/redux/features/storeConfigSlice";
import { RootState } from "@/types/global";

const NO_AUTO_REFETCH = {
  refetchOnMountOrArgChange: false,
  refetchOnFocus: false,
  refetchOnReconnect: false,
} as const;

/** Keeps RTK Query subscriptions alive so select-only hooks don't lose cache. */
export default function PromoConfigCacheRetainer() {
  const userId = useSelector((s: RootState) => s.auth?.userData?._id);
  const isGuestUser = useSelector(
    (s: RootState) => s.auth?.userData?.isGuestUser,
  );
  const isAdminUser = useSelector(
    (s: RootState) => s.auth?.userData?.isAdminUser,
  );
  const isDriverUser = useSelector(
    (s: RootState) => s.auth?.userData?.isDriverUser,
  );
  const localHydrated = useSelector(
    (s: RootState) => Boolean(s.appSync?.localHydrated),
  );

  const skip =
    !userId ||
    !localHydrated ||
    Boolean(isAdminUser) ||
    Boolean(isDriverUser);

  // Guests: keep offers/delivery if you hydrate them; skip store-config like useStoreConfig
  useFetchOffersQuery(undefined, { ...NO_AUTO_REFETCH, skip });
  useFetchDeliverySettingsQuery(undefined, { ...NO_AUTO_REFETCH, skip });
  useFetchStoreConfigQuery(undefined, {
    ...NO_AUTO_REFETCH,
    skip: skip || Boolean(isGuestUser),
  });

  return null;
}