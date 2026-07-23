import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useFetchOffersQuery } from "@/redux/features/offerSlice";
import { useFetchDeliverySettingsQuery } from "@/redux/features/deliverySettingsSlice";
import { useFetchStoreConfigQuery } from "@/redux/features/storeConfigSlice";
import { useFetchCarouselQuery } from "@/redux/features/carouselSlice";
import { useFetchCategoriesQuery } from "@/redux/features/categorySlice";
import { RootState } from "@/types/global";
import { devLog } from "@/utils/devLog";

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

  const skipBase =
    !userId ||
    !localHydrated ||
    Boolean(isAdminUser) ||
    Boolean(isDriverUser);

  // Guests only sync carousel + category; skip promo/store for them.
  const skipPromo = skipBase || Boolean(isGuestUser);
  const skipBrowse = skipBase;

  const offers = useFetchOffersQuery(undefined, {
    ...NO_AUTO_REFETCH,
    skip: skipPromo,
  });
  const delivery = useFetchDeliverySettingsQuery(undefined, {
    ...NO_AUTO_REFETCH,
    skip: skipPromo,
  });
  const storeConfig = useFetchStoreConfigQuery(undefined, {
    ...NO_AUTO_REFETCH,
    skip: skipPromo,
  });
  const carousel = useFetchCarouselQuery(undefined, {
    ...NO_AUTO_REFETCH,
    skip: skipBrowse,
  });
  const categories = useFetchCategoriesQuery(
    {},
    { ...NO_AUTO_REFETCH, skip: skipBrowse },
  );

  useEffect(() => {
    devLog("[promo-retainer]", {
      userId: userId ?? null,
      isGuestUser: Boolean(isGuestUser),
      isAdminUser: Boolean(isAdminUser),
      isDriverUser: Boolean(isDriverUser),
      localHydrated,
      skipPromo,
      skipBrowse,
      offers: {
        skip: skipPromo,
        status: offers.status,
        count: offers.data?.offers?.length ?? 0,
      },
      delivery: {
        skip: skipPromo,
        status: delivery.status,
        hasRaw: Boolean(delivery.data?.deliverySettings),
      },
      storeConfig: {
        skip: skipPromo,
        status: storeConfig.status,
        hasRaw: Boolean(storeConfig.data?.storeConfig),
      },
      carousel: {
        skip: skipBrowse,
        status: carousel.status,
        banners: carousel.data?.banners?.length ?? 0,
      },
      categories: {
        skip: skipBrowse,
        status: categories.status,
        count: categories.data?.categories?.length ?? 0,
      },
    });
  }, [
    userId,
    isGuestUser,
    isAdminUser,
    isDriverUser,
    localHydrated,
    skipPromo,
    skipBrowse,
    offers.status,
    offers.data?.offers?.length,
    delivery.status,
    delivery.data?.deliverySettings,
    storeConfig.status,
    storeConfig.data?.storeConfig,
    carousel.status,
    carousel.data?.banners?.length,
    categories.status,
    categories.data?.categories?.length,
  ]);

  return null;
}
