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
  FlatList,
  InteractionManager,
  Platform,
  RefreshControl,
  useWindowDimensions,
  ViewToken,
} from "react-native";
import { router } from "expo-router";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import {
  setCategoryData,
  useFetchCategoriesQuery,
  categoryApi,
} from "@/redux/features/categorySlice";
import { RootState, Category } from "@/types/global";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import { truncateText } from "@/utils/utils";
import CategoryCardPlaceholder from "./CategoryCardPlaceholder";
import CategoryCard from "./CategoryCard";
import DashboardHeader from "./DashboardHeader";
import store from "@/redux/store";
import { loadRecentlyViewed } from "@/redux/features/recentlyViewedSlice";
import DeferredFadeIn from "./DeferredFadeIn";
import { WEATHER_SLOT_HEIGHT } from "./WeatherSection/weatherLayout";
import HomeSearch from "./HomeSearch";
import {
  finalizeStartupReady,
  markStartupCheckpoint,
} from "@/utils/startupDiagnostics";
import { syncCarouselConfig } from "@/utils/carouselConfigCache";
import { setPrivateHomeMounted } from "@/redux/features/homePromoSlice";
import { productApi } from "@/redux/features/productSlice";
import {
  getCachedProducts,
  isCachedProductListEmpty,
  peekCachedProductsSync,
} from "@/utils/productCache";
import { syncStoreConfig } from "@/utils/storeConfigCache";
import HomeStoreStatus, {
  HOME_STORE_STATUS_HEIGHT,
} from "@/components/HomeStoreStatus";

const Carasole = lazy(() => import("./Carasole"));
const WeatherSection = lazy(() => import("./WeatherSection/WeatherSection"));
const GetTheApp = lazy(() => import("@/components/GetTheApp"));
const HomeProductPromo = lazy(() => import("@/components/HomeProductPromo"));
const HomeProductRail = lazy(() => import("@/components/HomeProductRail"));
const RecentlyViewedProducts = lazy(
  () => import("@/app/(private)/(productDetail)/RecentlyViewedProducts"),
);

const CATEGORY_PLACEHOLDER_COUNT = 3;
/** Prefetch first N product rails so the initial viewport isn't empty. */
const INITIAL_ENABLED_RAIL_COUNT = 2;
/** Parallel disk peeks while seeding empty rails — avoid AsyncStorage stampede. */
const DISK_CACHE_CONCURRENCY = 4;
/** Matches `HomeProductRail` fetch args — keep local so that module stays lazy. */
const HOME_RAIL_PRODUCT_LIMIT = 8;
/** Matches `GetTheApp` banner export — keep local so that module stays lazy. */
const GET_THE_APP_BANNER_HEIGHT = 72;
/** Matches `Carasole` — keep local so that module stays lazy. */
const CAROUSEL_PAGI_SLOT_HEIGHT = 40;
/** Matches `HomeProductRail` — keep local so that module stays lazy. */
const HOME_PRODUCT_RAIL_HEIGHT = 286;
/** Matches inline promo card + vertical margins. */
const HOME_PROMO_INLINE_SLOT_HEIGHT = 164;
/** Matches compact recently-viewed block (title + row). */
const HOME_RECENTLY_VIEWED_SLOT_HEIGHT = 288;
/** Matches `styles.topSection` minHeight (avatar + padding). */
const DASHBOARD_ROW_HEIGHT = 60;
/** Matches `styles.stickySearchBar` minHeight. */
const SEARCH_ROW_HEIGHT = Platform.OS === "android" ? 64 : 84;
/** Matches `styles.storeStatusSection`. */
const STORE_STATUS_ROW_HEIGHT = HOME_STORE_STATUS_HEIGHT + 12;
/**
 * Horizontal category strip — height does not scale with child count.
 * padding (32) + title (34) + gap (8) + selector (~135).
 */
const HOME_CATEGORY_CARD_BASE_HEIGHT = 209;
const HOME_CATEGORY_CARD_GAP = 16;

function getCarouselSlotHeight(windowWidth: number): number {
  return windowWidth / 2 + CAROUSEL_PAGI_SLOT_HEIGHT;
}

async function mapWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  if (!items.length) return;
  let nextIndex = 0;
  const run = async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      await worker(items[index]);
    }
  };
  const poolSize = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: poolSize }, () => run()));
}

/** True when memory/RTK already knows this subcategory has no products. */
function isHomeRailKnownEmpty(categoryId: string): boolean {
  if (
    isCachedProductListEmpty(
      peekCachedProductsSync(categoryId, 1, "default"),
    )
  ) {
    return true;
  }

  const entry = productApi.endpoints.fetchProducts.select({
    categoryId,
    page: 1,
    limit: HOME_RAIL_PRODUCT_LIMIT,
  })(store.getState() as never);

  if (entry?.isError) return true;
  if (entry?.data && isCachedProductListEmpty(entry.data)) return true;
  return false;
}

type HomeFeedItem =
  | { type: "dashboard"; id: string }
  | { type: "search"; id: string }
  | { type: "storeStatus"; id: string }
  | { type: "carousel"; id: string }
  | { type: "weather"; id: string }
  | { type: "getTheApp"; id: string }
  | { type: "categorySkeleton"; id: string; index: number }
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

function getHomeFeedItemHeight(
  item: HomeFeedItem,
  windowWidth: number,
): number {
  switch (item.type) {
    case "dashboard":
      return DASHBOARD_ROW_HEIGHT;
    case "search":
      return SEARCH_ROW_HEIGHT;
    case "storeStatus":
      return STORE_STATUS_ROW_HEIGHT;
    case "carousel":
      return getCarouselSlotHeight(windowWidth);
    case "weather":
      return WEATHER_SLOT_HEIGHT;
    case "getTheApp":
      return GET_THE_APP_BANNER_HEIGHT;
    case "categorySkeleton":
      return (
        HOME_CATEGORY_CARD_BASE_HEIGHT +
        (item.index !== CATEGORY_PLACEHOLDER_COUNT - 1
          ? HOME_CATEGORY_CARD_GAP
          : 0)
      );
    case "categoryCard":
      return (
        HOME_CATEGORY_CARD_BASE_HEIGHT +
        (item.index !== item.length - 1 ? HOME_CATEGORY_CARD_GAP : 0)
      );
    case "productRail":
      return HOME_PRODUCT_RAIL_HEIGHT;
    case "promo":
      return HOME_PROMO_INLINE_SLOT_HEIGHT;
    case "recentlyViewed":
      return HOME_RECENTLY_VIEWED_SLOT_HEIGHT;
    default:
      return 0;
  }
}

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
      const previouslyEnabled = [...enabled];
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
  const [enabled, setEnabled] = useState(() =>
    Boolean(railStore?.get(railId)),
  );

  useEffect(() => {
    if (!railStore) return;
    setEnabled(railStore.get(railId));
    return railStore.subscribe(railId, () => {
      setEnabled(railStore.get(railId));
    });
  }, [railStore, railId]);

  return enabled;
}

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
  onEmpty,
}: {
  item: ProductRailItem;
  onViewMore: (
    subCategory: Category,
    parentCategory: Category,
    index: number,
  ) => void;
  onEmpty: (railId: string) => void;
}) {
  const enabled = useRailEnabled(item.id);
  const railFallback = <View style={styles.productRailFallback} />;
  const handleEmpty = useCallback(() => {
    onEmpty(item.id);
  }, [onEmpty, item.id]);

  return (
    <Suspense fallback={railFallback}>
      <HomeProductRail
        parentCategory={item.parent}
        subCategory={item.subCategory}
        subCategoryIndex={item.subCategoryIndex}
        enabled={enabled}
        onEmpty={handleEmpty}
        onViewMore={onViewMore}
      />
    </Suspense>
  );
});

const PrivateHome = () => {
  const { width: windowWidth } = useWindowDimensions();
  const carouselFallbackHeight = getCarouselSlotHeight(windowWidth);
  const carouselFallbackStyle = useMemo(
    () => ({ width: windowWidth, height: carouselFallbackHeight }),
    [windowWidth, carouselFallbackHeight],
  );
  const dispatch = useDispatch<typeof store.dispatch>();
  const listRef = useRef<FlatList<HomeFeedItem>>(null);
  const firstCategoryIndexRef = useRef(0);
  const layoutOffsets = useRef({ sticky: 0 });
  const railEnableStoreRef = useRef<RailEnableStore | null>(null);
  if (!railEnableStoreRef.current) {
    railEnableStoreRef.current = createRailEnableStore();
  }
  const railEnableStore = railEnableStoreRef.current;
  const [isRefreshing, setIsRefreshing] = useState(false);
  /** Home-feed only — never mutates category tree / ProductList3. */
  const [omittedRails, setOmittedRails] = useState<Record<string, true>>({});
  const promoDockedInline = useSelector(
    (state: RootState) => state.homePromo.promoDockedInline,
  );
  const token = useSelector((state: RootState) => state?.auth?.token);
  const appSyncReady = useSelector((state: RootState) => state.appSync?.ready);
  const hasRecentlyViewed = useSelector((state: RootState) => {
    const items = (state as { recentlyViewed?: { items?: Array<{ type?: string; name?: string }> } })
      ?.recentlyViewed?.items;
    return Boolean(
      items?.some((item) => item?.type === "product" && item?.name),
    );
  });
  const categories = useSelector((state: RootState) => {
    return (
      categoryApi.endpoints.fetchCategories.select({})(state as never)?.data
        ?.categories ?? []
    );
  }, shallowEqual);

  const {
    isLoading: isCategoriesLoading,
    isFetching: isCategoriesFetching,
    isUninitialized: isCategoriesUninitialized,
    refetch,
  } = useFetchCategoriesQuery({}, { skip: !token || !appSyncReady });

  const showCategorySkeleton =
    !categories.length &&
    (!appSyncReady || isCategoriesLoading || isCategoriesFetching);

  const feedItems = useMemo((): HomeFeedItem[] => {
    const items: HomeFeedItem[] = [
      { type: "dashboard", id: "dashboard" },
      { type: "search", id: "search" },
      { type: "storeStatus", id: "storeStatus" },
    ];

    if (Platform.OS !== "web") {
      items.push({ type: "carousel", id: "carousel" });
    }

    items.push({ type: "weather", id: "weather" });

    if (Platform.OS === "web") {
      items.push({ type: "getTheApp", id: "getTheApp" });
    }

    firstCategoryIndexRef.current = items.length;

    if (showCategorySkeleton) {
      for (let index = 0; index < CATEGORY_PLACEHOLDER_COUNT; index += 1) {
        items.push({
          type: "categorySkeleton",
          id: `category-skeleton-${index}`,
          index,
        });
      }
    } else {
      const length = categories.length;

      categories.forEach((parent, index) => {
        items.push({
          type: "categoryCard",
          id: `category-${parent._id}`,
          category: parent,
          index,
          length,
        });

        (parent.children ?? []).forEach((subCategory, subCategoryIndex) => {
          const railId = `rail-${subCategory._id}`;
          if (omittedRails[railId]) return;
          // Skip rails already known empty (memory / RTK) so they never mount at 286px.
          if (subCategory._id && isHomeRailKnownEmpty(subCategory._id)) return;
          items.push({
            type: "productRail",
            id: railId,
            parent,
            subCategory,
            subCategoryIndex,
          });
        });
      });
    }

    if (promoDockedInline) {
      items.push({ type: "promo", id: "promo" });
    }

    if (hasRecentlyViewed) {
      items.push({ type: "recentlyViewed", id: "recentlyViewed" });
    }

    return items;
  }, [
    categories,
    showCategorySkeleton,
    promoDockedInline,
    hasRecentlyViewed,
    omittedRails,
  ]);

  const getItemLayout = useMemo(() => {
    const lengths = feedItems.map((item) =>
      getHomeFeedItemHeight(item, windowWidth),
    );
    const offsets: number[] = new Array(lengths.length);
    let offset = 0;
    for (let i = 0; i < lengths.length; i += 1) {
      offsets[i] = offset;
      offset += lengths[i];
    }
    return (_data: ArrayLike<HomeFeedItem> | null | undefined, index: number) => ({
      length: lengths[index] ?? 0,
      offset: offsets[index] ?? 0,
      index,
    });
  }, [feedItems, windowWidth]);

  // Seed omitted rails from disk cache before / while first paint so empties
  // don't mount as full-height skeletons (home feed only).
  useEffect(() => {
    if (showCategorySkeleton || !categories.length) return;

    let cancelled = false;
    const subCategoryIds: string[] = [];
    for (const parent of categories) {
      for (const child of parent.children ?? []) {
        if (!child?._id) continue;
        // Skip ids already known empty in memory/RTK — no disk round-trip.
        if (isHomeRailKnownEmpty(child._id)) continue;
        subCategoryIds.push(child._id);
      }
    }

    (async () => {
      const emptyIds: Record<string, true> = {};
      await mapWithConcurrency(
        subCategoryIds,
        DISK_CACHE_CONCURRENCY,
        async (categoryId) => {
          if (cancelled) return;
          const data = await getCachedProducts(categoryId, 1, "default");
          if (isCachedProductListEmpty(data)) {
            emptyIds[`rail-${categoryId}`] = true;
          }
        },
      );
      if (cancelled || !Object.keys(emptyIds).length) return;
      setOmittedRails((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const railId of Object.keys(emptyIds)) {
          if (!next[railId]) {
            next[railId] = true;
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [categories, showCategorySkeleton]);

  // Prefetch first rails once the feed is known (per-rail listeners only).
  useEffect(() => {
    if (showCategorySkeleton) return;
    const firstRailIds = feedItems
      .filter((item): item is ProductRailItem => item.type === "productRail")
      .slice(0, INITIAL_ENABLED_RAIL_COUNT)
      .map((item) => item.id);

    if (!firstRailIds.length) return;
    railEnableStore.enableMany(firstRailIds);
  }, [feedItems, showCategorySkeleton, railEnableStore]);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      store.dispatch(loadRecentlyViewed());
    });
    return () => task.cancel();
  }, []);

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
        (item) => item?._id == parentCategory?._id,
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

  const handleRailEmpty = useCallback((railId: string) => {
    setOmittedRails((prev) =>
      prev[railId] ? prev : { ...prev, [railId]: true },
    );
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
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
      setOmittedRails({});
      railEnableStore.reset();
    } catch {
      // optional toast
    } finally {
      setIsRefreshing(false);
    }
  }, [dispatch, isCategoriesUninitialized, refetch, railEnableStore]);

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
        if (item?.type === "productRail") {
          ids.push(item.id);
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
    ({ item }: { item: HomeFeedItem }) => {
      switch (item.type) {
        case "dashboard":
          // Mount immediately — deferred mount with no reserved height
          // was pushing the category section down on first paint.
          return <DashboardFeedRow onProfilePress={handleProfilePress} />;
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
          const carouselFallback = (
            <View style={carouselFallbackStyle} />
          );
          return (
            <DeferredFadeIn delay={100} fallback={carouselFallback}>
              <Suspense fallback={carouselFallback}>
                <Carasole onScrollToCategories={scrollToCategories} />
              </Suspense>
            </DeferredFadeIn>
          );
        }
        case "weather":
          return (
            <View style={styles.weatherSection}>
              <DeferredFadeIn
                delay={Platform.OS === "web" ? 0 : 250}
                fallback={<View style={styles.weatherSlotFallback} />}
              >
                <Suspense
                  fallback={<View style={styles.weatherSlotFallback} />}
                >
                  <WeatherSection />
                </Suspense>
              </DeferredFadeIn>
            </View>
          );
        case "getTheApp":
          return (
            <View style={styles.getTheAppSection}>
              <DeferredFadeIn
                delay={Platform.OS === "web" ? 0 : 150}
                fallback={<View style={styles.getTheAppSlotFallback} />}
              >
                <Suspense
                  fallback={<View style={styles.getTheAppSlotFallback} />}
                >
                  <GetTheApp variant="banner" />
                </Suspense>
              </DeferredFadeIn>
            </View>
          );
        case "categorySkeleton":
          return (
            <CategoryCardPlaceholder
              index={item.index}
              length={CATEGORY_PLACEHOLDER_COUNT}
            />
          );
        case "categoryCard":
          return (
            <CategoryCard
              category={item.category}
              index={item.index}
              onSelect={handleCategorySelect}
              length={item.length}
            />
          );
        case "productRail":
          return (
            <ProductRailRow
              item={item}
              onViewMore={handleCategorySelect}
              onEmpty={handleRailEmpty}
            />
          );
        case "promo": {
          const promoFallback = (
            <View style={styles.promoFallback} />
          );
          return (
            <DeferredFadeIn delay={200} fallback={promoFallback}>
              <Suspense fallback={promoFallback}>
                <HomeProductPromo variant="inline" />
              </Suspense>
            </DeferredFadeIn>
          );
        }
        case "recentlyViewed": {
          const recentFallback = (
            <View style={styles.recentlyViewedFallback} />
          );
          return (
            <DeferredFadeIn delay={450} fallback={recentFallback}>
              <Suspense fallback={recentFallback}>
                <RecentlyViewedProducts variant="compact" />
              </Suspense>
            </DeferredFadeIn>
          );
        }
        default:
          return null;
      }
    },
    [
      handleProfilePress,
      onStickySearchLayout,
      carouselFallbackStyle,
      scrollToCategories,
      handleCategorySelect,
      handleRailEmpty,
    ],
  );

  return (
    <RailEnableContext.Provider value={railEnableStore}>
      <ScreenSafeWrapper
        showBackButton={false}
        wrapperStyle={{ paddingHorizontal: 0 }}
        showWeatherSection={true}
        showGradient={true}
      >
        <FlatList
          ref={listRef}
          data={feedItems}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          stickyHeaderIndices={[1]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          }
          bounces={Platform.OS === "android" ? false : true}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          initialNumToRender={6}
          maxToRenderPerBatch={4}
          windowSize={7}
          removeClippedSubviews={Platform.OS === "android"}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              listRef.current?.scrollToIndex({
                index: info.index,
                animated: true,
                viewOffset: layoutOffsets.current.sticky,
              });
            }, 100);
          }}
        />
      </ScreenSafeWrapper>
    </RailEnableContext.Provider>
  );
};

export default PrivateHome;

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 60,
  },
  topSection: {
    paddingTop: 10,
    // Avatar is 50; reserve so list layout doesn't jump if header paints late.
    minHeight: 60,
  },
  stickySearchBar: {
    zIndex: 10,
    // Search input padding + sticky bar padding (stable across platforms).
    minHeight: Platform.OS === "android" ? 64 : 84,
  },
  storeStatusSection: {
    height: HOME_STORE_STATUS_HEIGHT + 12,
    overflow: "hidden",
  },
  weatherSection: {
    height: WEATHER_SLOT_HEIGHT,
    minWidth: "100%",
    overflow: "hidden",
  },
  weatherSlotFallback: {
    height: WEATHER_SLOT_HEIGHT,
    width: "100%",
  },
  getTheAppSection: {
    height: GET_THE_APP_BANNER_HEIGHT,
    width: "100%",
    overflow: "hidden",
  },
  getTheAppSlotFallback: {
    height: GET_THE_APP_BANNER_HEIGHT,
    width: "100%",
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
  stickySearchBarContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: "#d4f0fd",
  },
});
