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
} from "react-native";
import { FlashList } from "@shopify/flash-list";
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
/**
 * The category API currently returns a tree rather than a cursor response.
 * Page the feed projection so the list never receives every category/rail row.
 */
const HOME_FEED_PAGE_SIZE = 24;
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

function hasRemainingHomeFeedRows(
  categories: Category[],
  omittedRails: Record<string, true>,
  categoryIndex: number,
  childStartIndex: number,
): boolean {
  const currentCategory = categories[categoryIndex];
  for (
    let childIndex = childStartIndex;
    childIndex < (currentCategory?.children ?? []).length;
    childIndex += 1
  ) {
    const child = currentCategory.children?.[childIndex];
    if (
      child?._id &&
      !omittedRails[`rail-${child._id}`] &&
      !isHomeRailKnownEmpty(child._id)
    ) {
      return true;
    }
  }

  // Every later parent category contributes at least its category-card row.
  return categoryIndex + 1 < categories.length;
}

const LEADING_FEED_ITEMS: readonly HomeFeedItem[] = [
  { type: "dashboard", id: "dashboard" },
  { type: "search", id: "search" },
  { type: "storeStatus", id: "storeStatus" },
  ...(Platform.OS !== "web" ? [{ type: "carousel" as const, id: "carousel" }] : []),
  { type: "weather", id: "weather" },
  ...(Platform.OS === "web" ? [{ type: "getTheApp" as const, id: "getTheApp" }] : []),
];

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
  onRailEmpty: (railId: string) => void;
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
  if (
    previous.type === "categorySkeleton" &&
    next.type === "categorySkeleton"
  ) {
    return previous.index === next.index;
  }
  return true;
}

/**
 * Heterogeneous feed renderer. Its comparator intentionally uses stable ids and
 * source-object references so pagination and unrelated store updates do not
 * re-render mounted rows.
 */
const ListItem = memo(
  function ListItem({
    item,
    carouselFallbackStyle,
    onProfilePress,
    onStickySearchLayout,
    onScrollToCategories,
    onCategorySelect,
    onRailEmpty,
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
            <DeferredFadeIn delay={100} fallback={fallback}>
              <Suspense fallback={fallback}>
                <Carasole onScrollToCategories={onScrollToCategories} />
              </Suspense>
            </DeferredFadeIn>
          </View>
        );
      }
      case "weather":
        return (
          <View style={styles.weatherSection}>
            <DeferredFadeIn
              delay={Platform.OS === "web" ? 0 : 250}
              fallback={<View style={styles.weatherSlotFallback} />}
            >
              <Suspense fallback={<View style={styles.weatherSlotFallback} />}>
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
              <Suspense fallback={<View style={styles.getTheAppSlotFallback} />}>
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
            onSelect={onCategorySelect}
            length={item.length}
          />
        );
      case "productRail":
        return (
          <ProductRailRow
            item={item}
            onViewMore={onCategorySelect}
            onEmpty={onRailEmpty}
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
    (areHomeFeedItemsEqual(previous.item, next.item) &&
      previous.carouselFallbackStyle === next.carouselFallbackStyle &&
      previous.onProfilePress === next.onProfilePress &&
      previous.onStickySearchLayout === next.onStickySearchLayout &&
      previous.onScrollToCategories === next.onScrollToCategories &&
      previous.onCategorySelect === next.onCategorySelect &&
      previous.onRailEmpty === next.onRailEmpty),
);

const PrivateHome = () => {
  const { width: windowWidth } = useWindowDimensions();
  const carouselFallbackHeight = getCarouselSlotHeight(windowWidth);
  const carouselFallbackStyle = useMemo(
    () => ({ width: windowWidth, height: carouselFallbackHeight }),
    [windowWidth, carouselFallbackHeight],
  );
  const dispatch = useDispatch<typeof store.dispatch>();
  const listRef = useRef<any>(null);
  const firstCategoryIndexRef = useRef(0);
  const layoutOffsets = useRef({ sticky: 0 });
  const isLoadingNextPageRef = useRef(false);
  const railEnableStoreRef = useRef<RailEnableStore | null>(null);
  if (!railEnableStoreRef.current) {
    railEnableStoreRef.current = createRailEnableStore();
  }
  const railEnableStore = railEnableStoreRef.current;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [visibleFeedItemCount, setVisibleFeedItemCount] = useState(
    HOME_FEED_PAGE_SIZE,
  );
  /** Home-feed only — never mutates category tree / ProductList3. */
  const [omittedRails, setOmittedRails] = useState<Record<string, true>>({});
  const promoDockedInline = useSelector(
    (state: RootState & { homePromo: { promoDockedInline: boolean } }) =>
      state.homePromo.promoDockedInline,
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

  const categoryFeedPage = useMemo(() => {
    if (showCategorySkeleton) {
      return {
        items: Array.from({ length: CATEGORY_PLACEHOLDER_COUNT }, (_, index) => ({
          type: "categorySkeleton" as const,
          id: `category-skeleton-${index}`,
          index,
        })),
        hasMore: true,
      };
    }

    const items: HomeFeedItem[] = [];
    let remaining = visibleFeedItemCount;
    const length = categories.length;
    for (let index = 0; index < length; index += 1) {
      if (remaining === 0) {
        return { items, hasMore: true };
      }

      const parent = categories[index] as Category;
      items.push({
          type: "categoryCard",
          id: `category-${parent._id}`,
          category: parent,
          index,
          length,
      });
      remaining -= 1;

      if (remaining === 0) {
        return {
          items,
          hasMore: hasRemainingHomeFeedRows(
            categories as Category[],
            omittedRails,
            index,
            0,
          ),
        };
      }

      for (
        let subCategoryIndex = 0;
        subCategoryIndex < (parent.children ?? []).length;
        subCategoryIndex += 1
      ) {
        const subCategory = parent.children?.[subCategoryIndex] as Category;
        const railId = `rail-${subCategory._id}`;
        if (omittedRails[railId] || (subCategory._id && isHomeRailKnownEmpty(subCategory._id))) {
          continue;
        }
        items.push({
          type: "productRail",
          id: railId,
          parent,
          subCategory,
          subCategoryIndex,
        });
        remaining -= 1;

        if (remaining === 0) {
          return {
            items,
            hasMore: hasRemainingHomeFeedRows(
              categories as Category[],
              omittedRails,
              index,
              subCategoryIndex + 1,
            ),
          };
        }
      }
    }
    return {
      items,
      hasMore: false,
    };
  }, [categories, omittedRails, showCategorySkeleton, visibleFeedItemCount]);

  const feedItems = useMemo((): HomeFeedItem[] => {
    firstCategoryIndexRef.current = LEADING_FEED_ITEMS.length;
    const items: HomeFeedItem[] = [...LEADING_FEED_ITEMS, ...categoryFeedPage.items];
    // Tail content is reached after category pagination, preserving its
    // existing visual location without mounting it during initial paint.
    if (!categoryFeedPage.hasMore && promoDockedInline) {
      items.push({ type: "promo", id: "promo" });
    }

    if (!categoryFeedPage.hasMore && hasRecentlyViewed) {
      items.push({ type: "recentlyViewed", id: "recentlyViewed" });
    }

    return items;
  }, [
    categoryFeedPage,
    promoDockedInline,
    hasRecentlyViewed,
  ]);

  useEffect(() => {
    setVisibleFeedItemCount(HOME_FEED_PAGE_SIZE);
  }, [categories]);

  useEffect(() => {
    isLoadingNextPageRef.current = false;
  }, [visibleFeedItemCount]);

  // Probe only projected rails. Queuing every subcategory here would create
  // unnecessary AsyncStorage work on a large feed before rows can be viewed.
  useEffect(() => {
    if (showCategorySkeleton) return;

    let cancelled = false;
    const subCategoryIds = categoryFeedPage.items
      .filter(
        (item: HomeFeedItem): item is ProductRailItem =>
          item.type === "productRail",
      )
      .map((item) => item.subCategory._id)
      .filter(
        (categoryId): categoryId is string =>
          Boolean(categoryId) && !isHomeRailKnownEmpty(categoryId),
      );

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
  }, [categoryFeedPage.items, showCategorySkeleton]);

  // Prefetch first rails once the feed is known (per-rail listeners only).
  useEffect(() => {
    if (showCategorySkeleton) return;
    const firstRailIds = feedItems
      .filter(
        (item: HomeFeedItem): item is ProductRailItem =>
          item.type === "productRail",
      )
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
        (item: Category) => item?._id == parentCategory?._id,
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
    // A pull refresh represents a fresh feed snapshot. Reset the local page
    // cursor independently of whether RTK reuses the category array reference.
    setVisibleFeedItemCount(HOME_FEED_PAGE_SIZE);
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

  const loadNextPage = useCallback(() => {
    if (
      showCategorySkeleton ||
      !categoryFeedPage.hasMore ||
      isLoadingNextPageRef.current
    ) {
      return;
    }
    isLoadingNextPageRef.current = true;
    setVisibleFeedItemCount((current) => current + HOME_FEED_PAGE_SIZE);
  }, [categoryFeedPage.hasMore, showCategorySkeleton]);

  const renderItem = useCallback(
    ({ item }: { item: HomeFeedItem }) => {
      return (
        <ListItem
          item={item}
          carouselFallbackStyle={carouselFallbackStyle}
          onProfilePress={handleProfilePress}
          onStickySearchLayout={onStickySearchLayout}
          onScrollToCategories={scrollToCategories}
          onCategorySelect={handleCategorySelect}
          onRailEmpty={handleRailEmpty}
        />
      );
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
        <FlashList<HomeFeedItem>
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
          bounces={Platform.OS === "android" ? false : true}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onEndReached={loadNextPage}
          onEndReachedThreshold={0.5}
          maintainVisibleContentPosition={{
            disabled: false,
            autoscrollToBottomThreshold: 0.1,
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
