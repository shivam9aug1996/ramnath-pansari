import React, {
  createContext,
  lazy,
  memo,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  StyleSheet,
  View,
  InteractionManager,
  Platform,
  RefreshControl,
  useWindowDimensions,
  ViewToken,
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
} from "react-native";
import { router } from "expo-router";
import { useDispatch, useSelector } from "react-redux";

import store from "@/redux/store";
import {
  setCategoryData,
  useFetchCategoriesQuery,
  categoryApi,
} from "@/redux/features/categorySlice";
import { loadRecentlyViewed } from "@/redux/features/recentlyViewedSlice";
import { setPrivateHomeMounted } from "@/redux/features/homePromoSlice";
import { productApi } from "@/redux/features/productSlice";

import { RootState, Category } from "@/types/global";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import { truncateText } from "@/utils/utils";
import CategoryCard from "./CategoryCard";
import DashboardHeader from "./DashboardHeader";
import DeferredFadeIn from "./DeferredFadeIn";
import HomeSearch from "./HomeSearch";
import HomeStoreStatus, {
  HOME_STORE_STATUS_HEIGHT,
} from "@/components/HomeStoreStatus";
import { Colors } from "@/constants/Colors";

import { WEATHER_SLOT_HEIGHT } from "./WeatherSection/weatherLayout";
import {
  finalizeStartupReady,
  markStartupCheckpoint,
} from "@/utils/startupDiagnostics";
import { syncCarouselConfig } from "@/utils/carouselConfigCache";
import { syncStoreConfig } from "@/utils/storeConfigCache";

// Lazy-loaded components
const Carasole = lazy(() => import("./Carasole"));
const WeatherSection = lazy(() => import("./WeatherSection/WeatherSection"));
const GetTheApp = lazy(() => import("@/components/GetTheApp"));
const HomeProductPromo = lazy(() => import("@/components/HomeProductPromo"));
const HomeProductRail = lazy(() => import("@/components/HomeProductRail"));
const RecentlyViewedProducts = lazy(
  () => import("@/app/(private)/(productDetail)/RecentlyViewedProducts"),
);

// Constants
const HOME_RAIL_PRODUCT_LIMIT = 8;
const GET_THE_APP_BANNER_HEIGHT = 72;
const CAROUSEL_PAGI_SLOT_HEIGHT = 40;
const HOME_PRODUCT_RAIL_HEIGHT = 286;
const HOME_PROMO_INLINE_SLOT_HEIGHT = 164;
const HOME_RECENTLY_VIEWED_SLOT_HEIGHT = 288;

function getCarouselSlotHeight(windowWidth: number): number {
  return windowWidth / 2 + CAROUSEL_PAGI_SLOT_HEIGHT;
}

// --- Skeleton Placeholders ---

const WeatherSlotSkeleton = memo(function WeatherSlotSkeleton() {
  return (
    <View style={styles.weatherSkeleton}>
      <View style={styles.weatherSkeletonCard}>
        <View style={styles.weatherSkeletonLine} />
        <View style={[styles.weatherSkeletonLine, styles.weatherSkeletonLineShort]} />
      </View>
      <View style={styles.weatherSkeletonDots}>
        <View style={[styles.weatherSkeletonDot, styles.weatherSkeletonDotActive]} />
        <View style={styles.weatherSkeletonDot} />
        <View style={styles.weatherSkeletonDot} />
      </View>
    </View>
  );
});

const GetTheAppSlotSkeleton = memo(function GetTheAppSlotSkeleton() {
  return (
    <View style={styles.getTheAppSkeleton}>
      <View style={styles.getTheAppSkeletonCopy}>
        <View style={styles.getTheAppSkeletonTitle} />
        <View style={styles.getTheAppSkeletonSub} />
      </View>
      <View style={styles.getTheAppSkeletonActions}>
        <View style={styles.getTheAppSkeletonChip} />
        <View style={styles.getTheAppSkeletonChip} />
      </View>
    </View>
  );
});

// --- Types ---

type HomeFeedItem =
  | { type: "dashboard"; id: string }
  | { type: "search"; id: string }
  | { type: "storeStatus"; id: string }
  | { type: "carousel"; id: string }
  | { type: "weather"; id: string }
  | { type: "getTheApp"; id: string }
  | {
      type: "categoryCard";
      id: string;
      category: Category;
      index: number;
      length: number;
    }
  | {
      type: "productRail";
      id: string;
      parent: Category;
      subCategory: Category;
      subCategoryIndex: number;
    }
  | { type: "promo"; id: string }
  | { type: "recentlyViewed"; id: string };

type ProductRailItem = Extract<HomeFeedItem, { type: "productRail" }>;

const LEADING_FEED_ITEMS: readonly HomeFeedItem[] = [
  { type: "dashboard", id: "dashboard" },
  { type: "search", id: "search" },
  { type: "storeStatus", id: "storeStatus" },
  ...(Platform.OS !== "web" ? [{ type: "carousel" as const, id: "carousel" }] : []),
  { type: "weather", id: "weather" },
  ...(Platform.OS === "web" ? [{ type: "getTheApp" as const, id: "getTheApp" }] : []),
];

// --- Rail Enable Store (Pub/Sub pattern for performance) ---

type RailEnableStore = {
  get: (id: string) => boolean;
  enableMany: (ids: string[]) => void;
  subscribe: (id: string, onChange: () => void) => () => void;
  reset: () => void;
};

function createRailEnableStore(): RailEnableStore {
  const enabled = new Set<string>();
  const listeners = new Map<string, Set<() => void>>();

  return {
    get: (id) => enabled.has(id),
    enableMany: (ids) => {
      for (const id of ids) {
        if (enabled.has(id)) continue;
        enabled.add(id);
        listeners.get(id)?.forEach((listener) => listener());
      }
    },
    subscribe: (id, onChange) => {
      let set = listeners.get(id);
      if (!set) {
        set = new Set();
        listeners.set(id, set);
      }
      set.add(onChange);
      return () => {
        set!.delete(onChange);
        if (set!.size === 0) listeners.delete(id);
      };
    },
    reset: () => {
      if (!enabled.size) return;
      const previouslyEnabled = Array.from(enabled);
      enabled.clear();
      for (const id of previouslyEnabled) {
        listeners.get(id)?.forEach((listener) => listener());
      }
    },
  };
}

const RailEnableContext = createContext<RailEnableStore | null>(null);

function useRailEnabled(railId: string): boolean {
  const railStore = useContext(RailEnableContext);
  const [enabled, setEnabled] = useState(() => Boolean(railStore?.get(railId)));

  useEffect(() => {
    if (!railStore) return;
    setEnabled(railStore.get(railId));
    return railStore.subscribe(railId, () => {
      setEnabled(railStore.get(railId));
    });
  }, [railStore, railId]);

  return enabled;
}

// --- Feed Feed Row Components ---

const DashboardFeedRow = memo(function DashboardFeedRow({
  onProfilePress,
}: {
  onProfilePress: () => void;
}) {
  const userName = useSelector((state: RootState) =>
    truncateText(state?.auth?.userData?.name?.split(" ")[0], 10),
  );
  const profileImage = useSelector(
    (state: RootState) => state?.auth?.userData?.profileImage ?? null,
  );
  const isGuestUser = useSelector(
    (state: RootState) => state?.auth?.userData?.isGuestUser,
  );

  return (
    <View style={styles.topSection}>
      <DashboardHeader
        userName={userName}
        profileImage={profileImage}
        onProfilePress={onProfilePress}
        isGuestUser={isGuestUser}
      />
    </View>
  );
});

const ProductRailRow = memo(function ProductRailRow({
  item,
  onViewMore,
}: {
  item: ProductRailItem;
  onViewMore: (
    subCategory: Category,
    parentCategory: Category,
    index: number,
  ) => void;
}) {
  const enabled = useRailEnabled(item.id);

  return (
    <Suspense fallback={<View style={styles.productRailFallback} />}>
      <HomeProductRail
        parentCategory={item.parent}
        subCategory={item.subCategory}
        subCategoryIndex={item.subCategoryIndex}
        enabled={enabled}
        onViewMore={onViewMore}
      />
    </Suspense>
  );
});

type ListItemProps = {
  item: HomeFeedItem;
  carouselFallbackStyle: { width: number; height: number };
  onProfilePress: () => void;
  onStickySearchLayout: (event: { nativeEvent: { layout: { height: number } } }) => void;
  onScrollToCategories: () => void;
  onCategorySelect: (
    subCategory: Category,
    parentCategory: Category,
    index: number,
  ) => void;
};

function areHomeFeedItemsEqual(
  previous: HomeFeedItem,
  next: HomeFeedItem,
): boolean {
  if (previous === next) return true;
  if (previous.id !== next.id || previous.type !== next.type) return false;
  if (previous.type === "categoryCard" && next.type === "categoryCard") {
    return (
      previous.category === next.category &&
      previous.index === next.index &&
      previous.length === next.length
    );
  }
  if (previous.type === "productRail" && next.type === "productRail") {
    return (
      previous.parent === next.parent &&
      previous.subCategory === next.subCategory &&
      previous.subCategoryIndex === next.subCategoryIndex
    );
  }
  return true;
}

const ListItem = memo(
  function ListItem({
    item,
    carouselFallbackStyle,
    onProfilePress,
    onStickySearchLayout,
    onScrollToCategories,
    onCategorySelect,
  }: ListItemProps) {
    switch (item.type) {
      case "dashboard":
        return <DashboardFeedRow onProfilePress={onProfilePress} />;
      case "search":
        return (
          <View style={styles.stickySearchBar} onLayout={onStickySearchLayout}>
            <View style={styles.stickySearchBarContent}>
              <HomeSearch compact />
            </View>
          </View>
        );
      case "storeStatus":
        return (
          <View style={styles.storeStatusSection}>
            <HomeStoreStatus />
          </View>
        );
      case "carousel": {
        const fallback = <View style={carouselFallbackStyle} />;
        return (
          <View style={carouselFallbackStyle}>
            <DeferredFadeIn delay={Platform.OS === "web" ? 0 : 100} style={styles.flex1} fallback={fallback}>
              <Suspense fallback={fallback}>
                <Carasole onScrollToCategories={onScrollToCategories} />
              </Suspense>
            </DeferredFadeIn>
          </View>
        );
      }
      case "weather": {
        const fallback = <WeatherSlotSkeleton />;
        return (
          <View style={styles.weatherSection}>
            <DeferredFadeIn delay={Platform.OS === "web" ? 0 : 100} fallback={fallback}>
              <Suspense fallback={fallback}>
                <WeatherSection />
              </Suspense>
            </DeferredFadeIn>
          </View>
        );
      }
      case "getTheApp": {
        const fallback = <GetTheAppSlotSkeleton />;
        return (
          <View style={styles.getTheAppSection}>
            <DeferredFadeIn delay={Platform.OS === "web" ? 0 : 100} fallback={fallback}>
              <Suspense fallback={fallback}>
                <GetTheApp variant="banner" />
              </Suspense>
            </DeferredFadeIn>
          </View>
        );
      }
      case "categoryCard":
        return (
          <CategoryCard
            category={item.category}
            index={item.index}
            onSelect={onCategorySelect}
            length={item.length}
          />
        );
      case "productRail":
        return (
          <ProductRailRow
            item={item}
            onViewMore={onCategorySelect}
          />
        );
      case "promo": {
        const fallback = <View style={styles.promoFallback} />;
        return (
          <DeferredFadeIn delay={200} fallback={fallback}>
            <Suspense fallback={fallback}>
              <HomeProductPromo variant="inline" />
            </Suspense>
          </DeferredFadeIn>
        );
      }
      case "recentlyViewed": {
        const fallback = <View style={styles.recentlyViewedFallback} />;
        return (
          <DeferredFadeIn delay={450} fallback={fallback}>
            <Suspense fallback={fallback}>
              <RecentlyViewedProducts variant="compact" />
            </Suspense>
          </DeferredFadeIn>
        );
      }
    }
  },
  (previous, next) =>
    areHomeFeedItemsEqual(previous.item, next.item) &&
    previous.carouselFallbackStyle.width === next.carouselFallbackStyle.width &&
    previous.carouselFallbackStyle.height === next.carouselFallbackStyle.height &&
    previous.onProfilePress === next.onProfilePress &&
    previous.onStickySearchLayout === next.onStickySearchLayout &&
    previous.onScrollToCategories === next.onScrollToCategories &&
    previous.onCategorySelect === next.onCategorySelect,
);

// --- Helpers ---

const EMPTY_CATEGORIES: Category[] = [];

function buildCategoryFeedItems(categories: Category[]): HomeFeedItem[] {
  const items: HomeFeedItem[] = [];
  const rails: HomeFeedItem[] = [];
  const length = categories.length;

  for (let index = 0; index < length; index += 1) {
    const parent = categories[index];
    items.push({
      type: "categoryCard",
      id: `category-${parent._id}`,
      category: parent,
      index,
      length,
    });

    const children = parent.children ?? [];
    for (let subCategoryIndex = 0; subCategoryIndex < children.length; subCategoryIndex += 1) {
      const subCategory = children[subCategoryIndex];
      if (!subCategory?._id) continue;
      rails.push({
        type: "productRail",
        id: `rail-${subCategory._id}`,
        parent,
        subCategory,
        subCategoryIndex,
      });
    }
  }

  return items.concat(rails);
}

// --- Main Component ---

const PrivateHome = () => {
  const { width: windowWidth } = useWindowDimensions();
  const dispatch = useDispatch<typeof store.dispatch>();
  
  const listRef = useRef<FlatList<HomeFeedItem>>(null);
  const firstCategoryIndexRef = useRef(0);
  const layoutOffsets = useRef({ sticky: 0 });
  const homeRailSubscriptionsRef = useRef(new Map<string, () => void>());
  const railEnableStoreRef = useRef<RailEnableStore | null>(null);

  if (!railEnableStoreRef.current) {
    railEnableStoreRef.current = createRailEnableStore();
  }
  const railEnableStore = railEnableStoreRef.current;

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Redux Selectors
  const promoDockedInline = useSelector(
    (state: RootState & { homePromo: { promoDockedInline: boolean } }) =>
      state.homePromo.promoDockedInline,
  );
  const token = useSelector((state: RootState) => state?.auth?.token);
  const appSyncReady = useSelector((state: RootState) => state.appSync?.ready);
  
  const hasRecentlyViewed = useSelector((state: RootState) => {
    const items = (state as { recentlyViewed?: { items?: Array<{ type?: string; name?: string }> } })
      ?.recentlyViewed?.items;
    return Boolean(items?.some((item) => item?.type === "product" && item?.name));
  });

  const categories = useSelector(
    (state: RootState) =>
      categoryApi.endpoints.fetchCategories.select({})(state as never)?.data
        ?.categories ?? EMPTY_CATEGORIES,
  );

  const {
    isLoading: isCategoriesLoading,
    isFetching: isCategoriesFetching,
    isUninitialized: isCategoriesUninitialized,
    refetch,
  } = useFetchCategoriesQuery({}, { skip: !token || !appSyncReady });

  const carouselFallbackHeight = getCarouselSlotHeight(windowWidth);
  const carouselFallbackStyle = useMemo(
    () => ({ width: windowWidth, height: carouselFallbackHeight }),
    [windowWidth, carouselFallbackHeight],
  );

  const categoriesWaiting =
    !categories.length &&
    (!appSyncReady || isCategoriesLoading || isCategoriesFetching);

  const isInitialFeedReady = !categoriesWaiting;

  const feedItems = useMemo((): HomeFeedItem[] => {
    if (!isInitialFeedReady) return [];
    firstCategoryIndexRef.current = LEADING_FEED_ITEMS.length;

    const items: HomeFeedItem[] = [
      ...LEADING_FEED_ITEMS,
      ...buildCategoryFeedItems(categories as Category[]),
    ];

    if (promoDockedInline) {
      items.push({ type: "promo", id: "promo" });
    }
    if (hasRecentlyViewed) {
      items.push({ type: "recentlyViewed", id: "recentlyViewed" });
    }
    return items;
  }, [categories, hasRecentlyViewed, isInitialFeedReady, promoDockedInline]);

  const clearHomeRailSubscriptions = useCallback(() => {
    for (const unsubscribe of homeRailSubscriptionsRef.current.values()) {
      unsubscribe();
    }
    homeRailSubscriptionsRef.current.clear();
  }, []);

  useEffect(() => {
    return () => {
      clearHomeRailSubscriptions();
    };
  }, [clearHomeRailSubscriptions]);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      dispatch(loadRecentlyViewed());
    });
    return () => task.cancel();
  }, [dispatch]);

  useEffect(() => {
    markStartupCheckpoint("home_mounted", { screen: "home" }).catch(() => {});
    finalizeStartupReady({ screen: "home" }).catch(() => {});
  }, []);

  useEffect(() => {
    dispatch(setPrivateHomeMounted(true));
  }, [dispatch]);

  const handleCategorySelect = useCallback(
    (
      selectedCategory: Category,
      parentCategory: Category,
      _index: number,
    ) => {
      const selectedIndex = parentCategory.children.findIndex(
        (item) => item?._id === selectedCategory?._id,
      );
      const selectedCategory1 = categories.find(
        (item: Category) => item?._id === parentCategory?._id,
      );
      dispatch(setCategoryData(selectedCategory1));
      router.push(
        `/(category)/${parentCategory?._id?.toString()}?name=${parentCategory?.name}&selectedCategoryIdIndex=${selectedIndex?.toString()}`,
      );
    },
    [categories, dispatch],
  );

  const handleProfilePress = useCallback(() => {
    router.navigate("/(tabs)/account");
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    clearHomeRailSubscriptions();
    railEnableStore.reset();
    try {
      await Promise.all([
        isCategoriesUninitialized
          ? dispatch(
              categoryApi.endpoints.fetchCategories.initiate(
                {},
                { forceRefetch: true },
              ),
            ).unwrap()
          : refetch(),
        syncCarouselConfig(dispatch, { force: true }),
        syncStoreConfig(dispatch, { force: true }),
      ]);
    } catch {
      // Handle or ignore errors gracefully
    } finally {
      setIsRefreshing(false);
    }
  }, [
    clearHomeRailSubscriptions,
    dispatch,
    isCategoriesUninitialized,
    refetch,
    railEnableStore,
  ]);

  const scrollToCategories = useCallback(() => {
    const index = firstCategoryIndexRef.current;
    const stickyHeight = layoutOffsets.current.sticky;
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({
        index,
        animated: true,
        viewOffset: stickyHeight,
      });
    });
  }, []);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const ids: string[] = [];
      for (const token of viewableItems) {
        const item = token.item as HomeFeedItem | undefined;
        if (item?.type !== "productRail") continue;
        ids.push(item.id);
        const categoryId = item.subCategory?._id;
        if (categoryId && !homeRailSubscriptionsRef.current.has(item.id)) {
          const subscription = dispatch(
            productApi.endpoints.fetchProducts.initiate(
              {
                categoryId,
                page: 1,
                limit: HOME_RAIL_PRODUCT_LIMIT,
              },
              { subscribe: true },
            ),
          );
          homeRailSubscriptionsRef.current.set(item.id, () => {
            subscription.unsubscribe();
          });
        }
      }
      if (ids.length) {
        railEnableStoreRef.current?.enableMany(ids);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 15,
    minimumViewTime: 80,
  }).current;

  const keyExtractor = useCallback((item: HomeFeedItem) => item.id, []);

  const onStickySearchLayout = useCallback(
    (event: { nativeEvent: { layout: { height: number } } }) => {
      layoutOffsets.current.sticky = event.nativeEvent.layout.height;
    },
    [],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<HomeFeedItem>) => (
      <ListItem
        item={item}
        carouselFallbackStyle={carouselFallbackStyle}
        onProfilePress={handleProfilePress}
        onStickySearchLayout={onStickySearchLayout}
        onScrollToCategories={scrollToCategories}
        onCategorySelect={handleCategorySelect}
      />
    ),
    [
      carouselFallbackStyle,
      handleProfilePress,
      onStickySearchLayout,
      scrollToCategories,
      handleCategorySelect,
    ],
  );

  return (
    <RailEnableContext.Provider value={railEnableStore}>
      <ScreenSafeWrapper
        showBackButton={false}
        wrapperStyle={styles.wrapperStyle}
        showWeatherSection={true}
        showGradient={true}
      >
        {!isInitialFeedReady ? (
          <View style={styles.loadingGate}>
            <ActivityIndicator size="large" color={Colors.light.darkGreen} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={feedItems}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            stickyHeaderIndices={[1]}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
              />
            }
            bounces={Platform.OS !== "android"}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
          />
        )}
      </ScreenSafeWrapper>
    </RailEnableContext.Provider>
  );
};

export default PrivateHome;

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  wrapperStyle: {
    paddingHorizontal: 0,
  },
  loadingGate: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingBottom: 60,
  },
  topSection: {
    paddingTop: 10,
    minHeight: 60,
  },
  stickySearchBar: {
    zIndex: 10,
    minHeight: Platform.OS === "android" ? 64 : 84,
  },
  stickySearchBarContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: "#d4f0fd",
  },
  storeStatusSection: {
    height: HOME_STORE_STATUS_HEIGHT + 24,
    overflow: "hidden",
  },
  weatherSection: {
    height: WEATHER_SLOT_HEIGHT,
    minWidth: "100%",
    overflow: "hidden",
  },
  weatherSkeleton: {
    height: WEATHER_SLOT_HEIGHT,
    width: "100%",
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  weatherSkeletonCard: {
    height: 76,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#e8e8e8",
    backgroundColor: "#f7f7f7",
    paddingHorizontal: 15,
    paddingVertical: 18,
    justifyContent: "center",
    gap: 8,
    marginBottom: 4,
  },
  weatherSkeletonLine: {
    height: 10,
    borderRadius: 4,
    backgroundColor: "#ebebeb",
    width: "78%",
    alignSelf: "center",
  },
  weatherSkeletonLineShort: {
    width: "52%",
  },
  weatherSkeletonDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    height: 14,
  },
  weatherSkeletonDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#e0e0e0",
  },
  weatherSkeletonDotActive: {
    width: 14,
    backgroundColor: "#d0d0d0",
  },
  getTheAppSection: {
    height: GET_THE_APP_BANNER_HEIGHT,
    width: "100%",
    overflow: "hidden",
  },
  getTheAppSkeleton: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    height: 60,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: Colors.light.softGreen,
    borderWidth: 1,
    borderColor: "rgba(44, 175, 127, 0.12)",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  getTheAppSkeletonCopy: {
    flex: 1,
    gap: 8,
  },
  getTheAppSkeletonTitle: {
    height: 12,
    width: "70%",
    borderRadius: 4,
    backgroundColor: "rgba(25, 75, 56, 0.12)",
  },
  getTheAppSkeletonSub: {
    height: 10,
    width: "55%",
    borderRadius: 4,
    backgroundColor: "rgba(25, 75, 56, 0.08)",
  },
  getTheAppSkeletonActions: {
    flexDirection: "row",
    gap: 6,
  },
  getTheAppSkeletonChip: {
    width: 72,
    height: 30,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(44, 175, 127, 0.16)",
  },
  productRailFallback: {
    height: HOME_PRODUCT_RAIL_HEIGHT,
  },
  promoFallback: {
    height: HOME_PROMO_INLINE_SLOT_HEIGHT,
  },
  recentlyViewedFallback: {
    height: HOME_RECENTLY_VIEWED_SLOT_HEIGHT,
  },
});