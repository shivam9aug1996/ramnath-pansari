import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Platform,
  RefreshControl,
  useWindowDimensions,
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
import { Colors } from "@/constants/Colors";
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
import GrientBackground from "./GrientBackground";
import { LinearGradient } from "expo-linear-gradient";
import {
  finalizeStartupReady,
  markStartupCheckpoint,
} from "@/utils/startupDiagnostics";
import { categoryLog } from "@/utils/categoryDebug";
import { syncCarouselConfig } from "@/utils/carouselConfigCache";

const CATEGORY_PLACEHOLDER_COUNT = 3;
const WEATHER_SECTION_HEIGHT = 100;

const PrivateHome = () => {
  const { width: windowWidth } = useWindowDimensions();
  const carouselFallbackHeight = getCarouselSlotHeight(windowWidth);
  const dispatch = useDispatch<typeof store.dispatch>();
  const scrollRef = useRef<ScrollView>(null);
  const categoriesRef = useRef<View>(null);
  const categoriesScrollY = useRef(0);
  const layoutOffsets = useRef({ top: 0, sticky: 0, categoriesInMain: 0 });
  const [isRefreshing, setIsRefreshing] = useState(false);
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

  const lastCategoryLogKey = useRef<string | null>(null);

  useEffect(() => {
    if (!__DEV__) return;

    const logKey = [
      appSyncReady,
      isCategoriesLoading,
      isCategoriesFetching,
      isCategoriesUninitialized,
      categories.length,
      showCategorySkeleton,
    ].join(":");

    if (lastCategoryLogKey.current === logKey) return;
    lastCategoryLogKey.current = logKey;

    categoryLog("ui:read", {
      source: "PrivateHome",
      appSyncReady,
      querySkipped: !token || !appSyncReady,
      selectorCount: categories.length,
      isLoading: isCategoriesLoading,
      isFetching: isCategoriesFetching,
      isUninitialized: isCategoriesUninitialized,
      showSkeleton: showCategorySkeleton,
    });
  }, [
    appSyncReady,
    token,
    isCategoriesLoading,
    isCategoriesFetching,
    isCategoriesUninitialized,
    categories.length,
    showCategorySkeleton,
  ]);

  useEffect(() => {
    store.dispatch(loadRecentlyViewed());
  }, []);

  useEffect(() => {
    markStartupCheckpoint("home_mounted", { screen: "home" }).catch(() => {});
    finalizeStartupReady({ screen: "home" }).catch(() => {});
  }, []);

  const handleCategorySelect = (
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
  };

  const handleProfilePress = () => {
    router.navigate("/(tabs)/account");
  };

  const handleRefresh = async () => {
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
    } catch {
      // optional toast
    } finally {
      setIsRefreshing(false);
    }
  };

  const updateCategoriesScrollOffset = useCallback(() => {
    const { top, sticky, categoriesInMain } = layoutOffsets.current;
    categoriesScrollY.current = top + sticky + categoriesInMain;
  }, []);

  const scrollToCategories = useCallback(() => {
    const scrollView = scrollRef.current;
    const categories = categoriesRef.current;
    if (!scrollView) return;

    const stickyHeight = layoutOffsets.current.sticky;
    const scrollToY = (measuredY: number) => {
      const targetY = Math.max(0, measuredY - stickyHeight);
      requestAnimationFrame(() => {
        scrollView.scrollTo({ y: targetY, animated: true });
      });
    };

    if (!categories) {
      updateCategoriesScrollOffset();
      scrollToY(categoriesScrollY.current);
      return;
    }

    categories.measureLayout(
      scrollView,
      (_x, measuredY) => scrollToY(measuredY),
      () => {
        updateCategoriesScrollOffset();
        scrollToY(categoriesScrollY.current);
      },
    );
  }, [updateCategoriesScrollOffset]);

  return (
    <ScreenSafeWrapper
      showBackButton={false}
      wrapperStyle={{ paddingHorizontal: 0 }}
      showWeatherSection={true}
      showGradient={true}
    >
      <ScrollView
      keyboardShouldPersistTaps="handled"
        ref={scrollRef}
        style={{ flex: 1 }}
        stickyHeaderIndices={[1]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        bounces={Platform.OS === "android" ? false : true}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 60 }]}
      >
        <View
          style={styles.topSection}
          onLayout={(event) => {
            layoutOffsets.current.top = event.nativeEvent.layout.height;
            updateCategoriesScrollOffset();
          }}
        >
          <DeferredFadeIn delay={100}>
            <DashboardHeader
              userName={truncateText(userData?.name?.split(" ")[0], 10)}
              profileImage={userData?.profileImage}
              onProfilePress={handleProfilePress}
              isGuestUser={userData?.isGuestUser}
            />
          </DeferredFadeIn>
        </View>

        <View
          style={styles.stickySearchBar}
          onLayout={(event) => {
            layoutOffsets.current.sticky = event.nativeEvent.layout.height;
            updateCategoriesScrollOffset();
          }}
        >
          <DeferredFadeIn delay={100}>
            <View style={styles.stickySearchBarContent}>
              <HomeSearch compact />
            </View>
          </DeferredFadeIn>
        </View>

        <View style={styles.mainContent}>
          {Platform.OS !== "web" && (
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
          )}

          <View style={styles.weatherSection}>
            <DeferredFadeIn delay={100}>
              <WeatherSection />
            </DeferredFadeIn>
          </View>

          <DeferredFadeIn delay={200}>
            <View
              ref={categoriesRef}
              collapsable={false}
              onLayout={(event) => {
                layoutOffsets.current.categoriesInMain =
                  event.nativeEvent.layout.y;
                updateCategoriesScrollOffset();
              }}
            >
              {showCategorySkeleton
                ? Array.from({ length: CATEGORY_PLACEHOLDER_COUNT }).map(
                    (_, index) => (
                      <CategoryCardPlaceholder
                        key={`category-skeleton-${index}`}
                        index={index}
                        length={CATEGORY_PLACEHOLDER_COUNT}
                      />
                    ),
                  )
                : categories.map((category: Category, index: number) => (
                    <CategoryCard
                      key={category?._id?.toString()}
                      category={category}
                      index={index}
                      onSelect={handleCategorySelect}
                      length={categories.length}
                    />
                  ))}
            </View>
          </DeferredFadeIn>

          <DeferredFadeIn delay={500}>
            <RecentlyViewedProducts variant="compact" />
          </DeferredFadeIn>
        </View>
      </ScrollView>
    </ScreenSafeWrapper>
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
    // paddingHorizontal: 16,
    // paddingTop: 12,
    // paddingBottom: 12,
    zIndex: 10,
    //backgroundColor: 'rgba(179, 229, 252, 0.6)',
    // ...Platform.select({
    //   ios: {
    //     shadowColor: "#000",
    //     shadowOffset: { width: 0, height: 2 },
    //     shadowOpacity: 0.06,
    //     shadowRadius: 4,
    //   },
    //   android: {
    //     elevation: 3,
    //   },
    // }),
  },
  mainContent: {
    paddingTop: 4,
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
