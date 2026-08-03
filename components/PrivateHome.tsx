import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  StyleSheet,
  View,
  FlatList,
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
import RecentlyViewedProducts from "@/app/(private)/(productDetail)/RecentlyViewedProducts";
import Carasole, { getCarouselSlotHeight } from "./Carasole";
import WeatherSection from "./WeatherSection/WeatherSection";
import HomeSearch from "./HomeSearch";
import {
  finalizeStartupReady,
  markStartupCheckpoint,
} from "@/utils/startupDiagnostics";
import { syncCarouselConfig } from "@/utils/carouselConfigCache";
import HomeProductPromo from "@/components/HomeProductPromo";
import GetTheApp from "@/components/GetTheApp";
import HomeProductRail from "@/components/HomeProductRail";

const CATEGORY_PLACEHOLDER_COUNT = 3;
const WEATHER_SECTION_HEIGHT = 100;
/** Prefetch first N product rails so the initial viewport isn't empty. */
const INITIAL_ENABLED_RAIL_COUNT = 2;

type HomeFeedItem =
  | { type: "dashboard"; id: string }
  | { type: "search"; id: string }
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

const PrivateHome = () => {
  const { width: windowWidth } = useWindowDimensions();
  const carouselFallbackHeight = getCarouselSlotHeight(windowWidth);
  const dispatch = useDispatch<typeof store.dispatch>();
  const listRef = useRef<FlatList<HomeFeedItem>>(null);
  const firstCategoryIndexRef = useRef(0);
  const layoutOffsets = useRef({ sticky: 0 });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [enabledRails, setEnabledRails] = useState<Record<string, true>>({});
  const enabledRailsRef = useRef(enabledRails);
  enabledRailsRef.current = enabledRails;
  const promoDockedInline = useSelector(
    (state: RootState) => state.homePromo.promoDockedInline,
  );
  const token = useSelector((state: RootState) => state?.auth?.token);
  const appSyncReady = useSelector((state: RootState) => state.appSync?.ready);
  const userData = useSelector((state: RootState) => state?.auth?.userData);
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
          items.push({
            type: "productRail",
            id: `rail-${subCategory._id}`,
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

    items.push({ type: "recentlyViewed", id: "recentlyViewed" });

    return items;
  }, [categories, showCategorySkeleton, promoDockedInline]);

  // Prefetch first rails once the feed is known.
  useEffect(() => {
    if (showCategorySkeleton) return;
    const firstRailIds = feedItems
      .filter((item) => item.type === "productRail")
      .slice(0, INITIAL_ENABLED_RAIL_COUNT)
      .map((item) => item.id);

    if (!firstRailIds.length) return;

    setEnabledRails((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const id of firstRailIds) {
        if (!next[id]) {
          next[id] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [feedItems, showCategorySkeleton]);

  useEffect(() => {
    store.dispatch(loadRecentlyViewed());
  }, []);

  useEffect(() => {
    markStartupCheckpoint("home_mounted", { screen: "home" }).catch(() => {});
    finalizeStartupReady({ screen: "home" }).catch(() => {});
  }, []);

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
      ]);
      setEnabledRails({});
    } catch {
      // optional toast
    } finally {
      setIsRefreshing(false);
    }
  }, [dispatch, isCategoriesUninitialized, refetch]);

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
      setEnabledRails((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const token of viewableItems) {
          const item = token.item as HomeFeedItem | undefined;
          if (item?.type === "productRail" && !next[item.id]) {
            next[item.id] = true;
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 15,
    minimumViewTime: 80,
  }).current;

  const keyExtractor = useCallback((item: HomeFeedItem) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: HomeFeedItem }) => {
      switch (item.type) {
        case "dashboard":
          return (
            <View style={styles.topSection}>
              <DeferredFadeIn delay={100}>
                <DashboardHeader
                  userName={truncateText(userData?.name?.split(" ")[0], 10)}
                  profileImage={userData?.profileImage}
                  onProfilePress={handleProfilePress}
                  isGuestUser={userData?.isGuestUser}
                />
              </DeferredFadeIn>
            </View>
          );
        case "search":
          return (
            <View
              style={styles.stickySearchBar}
              onLayout={(event) => {
                layoutOffsets.current.sticky = event.nativeEvent.layout.height;
              }}
            >
              <DeferredFadeIn delay={100}>
                <View style={styles.stickySearchBarContent}>
                  <HomeSearch compact />
                </View>
              </DeferredFadeIn>
            </View>
          );
        case "carousel":
          return (
            <DeferredFadeIn
              delay={100}
              fallback={
                <View
                  style={{
                    width: windowWidth,
                    height: carouselFallbackHeight,
                  }}
                />
              }
            >
              <Carasole onScrollToCategories={scrollToCategories} />
            </DeferredFadeIn>
          );
        case "weather":
          return (
            <View style={styles.weatherSection}>
              <DeferredFadeIn delay={100}>
                <WeatherSection />
              </DeferredFadeIn>
            </View>
          );
        case "getTheApp":
          return (
            <DeferredFadeIn delay={150}>
              <GetTheApp variant="banner" />
            </DeferredFadeIn>
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
            <HomeProductRail
              parentCategory={item.parent}
              subCategory={item.subCategory}
              subCategoryIndex={item.subCategoryIndex}
              enabled={Boolean(enabledRailsRef.current[item.id])}
              onViewMore={handleCategorySelect}
            />
          );
        case "promo":
          return (
            <DeferredFadeIn delay={200}>
              <HomeProductPromo variant="inline" />
            </DeferredFadeIn>
          );
        case "recentlyViewed":
          return (
           
              <RecentlyViewedProducts variant="compact" />
            
          );
        default:
          return null;
      }
    },
    [
      userData,
      handleProfilePress,
      windowWidth,
      carouselFallbackHeight,
      scrollToCategories,
      handleCategorySelect,
    ],
  );

  return (
    <>
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
          extraData={enabledRails}
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
          windowSize={5}
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
    </>
  );
};

export default PrivateHome;

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 60,
  },
  topSection: {
    paddingTop: 10,
  },
  stickySearchBar: {
    zIndex: 10,
  },
  weatherSection: {
    minHeight: WEATHER_SECTION_HEIGHT,
    minWidth: "100%",
  },
  stickySearchBarContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: "#d4f0fd",
  },
});
