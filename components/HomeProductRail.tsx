import React, { memo, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSelector } from "react-redux";
import { Category, Product } from "@/types/global";
import { productApi } from "@/redux/features/productSlice";
import HomeProductRailCard, {
  HOME_RAIL_CARD_WIDTH,
} from "./HomeProductRailCard";
import { Colors } from "@/constants/Colors";

const PRODUCT_LIMIT = 8;
const SKELETON_COUNT = 4;

export const HOME_PRODUCT_RAIL_HEIGHT = 286;

type RailProductsData = {
  products?: Product[];
  totalResults?: number;
  totalProducts?: number;
};

type Props = {
  parentCategory: Category;
  subCategory: Category;
  subCategoryIndex: number;
  enabled?: boolean;
  onViewMore: (
    subCategory: Category,
    parentCategory: Category,
    index: number,
  ) => void;
};

const SkeletonCards = memo(function SkeletonCards() {
  return (
    <>
      {Array.from({ length: SKELETON_COUNT }, (_, i) => (
        <View key={i} style={styles.skeletonCard}>
          <View style={styles.skeletonImage} />
          <View style={styles.skeletonLine} />
          <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
        </View>
      ))}
    </>
  );
});

/**
 * Static placeholder reserved to preserve vertical feed height during loading or failure.
 */
const RailPlaceholder = memo(function RailPlaceholder({ title }: { title: string }) {
  return (
    <View style={styles.rail}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.viewMoreSlot} />
      </View>
      <View style={styles.placeholderRow}>
        <SkeletonCards />
      </View>
    </View>
  );
});

const HomeProductRail = ({
  parentCategory,
  subCategory,
  subCategoryIndex,
  enabled = false,
  onViewMore,
}: Props) => {
  const categoryId = subCategory?._id;

  const queryArgs = useMemo(
    () => ({
      categoryId,
      page: 1,
      limit: PRODUCT_LIMIT,
    }),
    [categoryId],
  );

  // Read state from RTK cache populated by PrivateHome screen subscription
  const queryState = useSelector(
    productApi.endpoints.fetchProducts.select(queryArgs),
  );

  const data = queryState?.data as RailProductsData | undefined;
  const products = useMemo(() => data?.products ?? [], [data?.products]);
  const totalResults =
    data?.totalResults ?? data?.totalProducts ?? products.length;
  const showViewMore = totalResults > products.length;

  const isError = queryState?.isError ?? false;
  const isLoadingProducts =
    enabled &&
    products.length === 0 &&
    !isError &&
    (queryState?.isUninitialized ||
      queryState?.isLoading ||
      queryState?.isFetching);

  const isEmpty =
    enabled && !isLoadingProducts && !isError && products.length === 0;

  const handleViewMore = useCallback(() => {
    onViewMore(subCategory, parentCategory, subCategoryIndex);
  }, [onViewMore, subCategory, parentCategory, subCategoryIndex]);

  if (!enabled || isLoadingProducts || (isError && products.length === 0)) {
    return <RailPlaceholder title={subCategory.name} />;
  }

  if (isEmpty) {
    return <View style={styles.collapsedRail} />;
  }

  return (
    <View style={styles.rail}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={showViewMore ? handleViewMore : undefined}
          activeOpacity={showViewMore ? 0.7 : 1}
          style={styles.titlePressable}
          disabled={!showViewMore}
        >
          <Text style={styles.title} numberOfLines={1}>
            {subCategory.name}
          </Text>
        </TouchableOpacity>

        <View style={styles.viewMoreSlot}>
          {showViewMore && (
            <TouchableOpacity onPress={handleViewMore} activeOpacity={0.7}>
              <Text style={styles.viewMore}>View more</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        nestedScrollEnabled
      >
        {products.map((product) => (
          <HomeProductRailCard key={product._id} item={product} />
        ))}
      </ScrollView>
    </View>
  );
};

export default memo(HomeProductRail);

const styles = StyleSheet.create({
  collapsedRail: {
    height: 0,
    overflow: "hidden",
    marginBottom: 0,
  },
  rail: {
    backgroundColor: "#ffffff",
    paddingVertical: 16,
    marginBottom: 8,
    height: HOME_PRODUCT_RAIL_HEIGHT,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 12,
    height: 20,
  },
  titlePressable: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontFamily: "Raleway_700Bold",
    fontSize: 16,
    color: "#222222",
    lineHeight: 20,
  },
  viewMoreSlot: {
    minWidth: 78,
    height: 20,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  viewMore: {
    fontFamily: "Raleway_700Bold",
    fontSize: 13,
    color: Colors.light.lightGreen,
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  placeholderRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    overflow: "hidden",
  },
  skeletonCard: {
    width: HOME_RAIL_CARD_WIDTH,
    marginRight: 12,
  },
  skeletonImage: {
    width: HOME_RAIL_CARD_WIDTH,
    height: HOME_RAIL_CARD_WIDTH,
    borderRadius: 12,
    backgroundColor: "#f3f3f3",
  },
  skeletonLine: {
    height: 10,
    borderRadius: 4,
    backgroundColor: "#f3f3f3",
    marginTop: 8,
    marginHorizontal: 4,
    width: "85%",
  },
  skeletonLineShort: {
    width: "45%",
    marginTop: 6,
  },
});