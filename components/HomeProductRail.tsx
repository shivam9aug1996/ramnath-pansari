import React, { memo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSelector } from "react-redux";
import { Category, Product, RootState } from "@/types/global";
import { useFetchProductsQuery } from "@/redux/features/productSlice";
import HomeProductRailCard, {
  HOME_RAIL_CARD_WIDTH,
} from "./HomeProductRailCard";
import { Colors } from "@/constants/Colors";

const PRODUCT_LIMIT = 8;
const SKELETON_COUNT = 4;

/**
 * Fixed rail height (padding + header + card) so placeholder → products
 * does not jump the vertical feed.
 */
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

/** Cheap reserved block — no scroll chrome until fetch is allowed. */
const RailPlaceholder = ({ title }: { title: string }) => (
  <View style={styles.rail}>
    <View style={styles.header}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.viewMoreSlot} />
    </View>
    <View style={styles.placeholderRow}>
      {Array.from({ length: SKELETON_COUNT }, (_, i) => (
        <View key={i} style={styles.skeletonCard}>
          <View style={styles.skeletonImage} />
          <View style={styles.skeletonLine} />
          <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
        </View>
      ))}
    </View>
  </View>
);

const HomeProductRail = ({
  parentCategory,
  subCategory,
  subCategoryIndex,
  enabled = false,
  onViewMore,
}: Props) => {
  const token = useSelector((state: RootState) => state?.auth?.token);
  const appSyncReady = useSelector((state: RootState) => state.appSync?.ready);

  const canFetch = Boolean(
    enabled && token && appSyncReady && subCategory?._id,
  );

  const { data, isLoading, isFetching, isError } = useFetchProductsQuery(
    {
      categoryId: subCategory._id,
      page: 1,
      limit: PRODUCT_LIMIT,
    },
    {
      skip: !canFetch,
    },
  );

  const railData = data as RailProductsData | undefined;
  const products: Product[] = railData?.products ?? [];
  const totalResults =
    railData?.totalResults ?? railData?.totalProducts ?? products.length;
  const showViewMore = totalResults > products.length;
  const isLoadingProducts =
    canFetch && (isLoading || isFetching) && products.length === 0 && !isError;
  const isEmpty =
    canFetch && !isLoadingProducts && (isError || products.length === 0);

  const handleViewMore = useCallback(() => {
    onViewMore(subCategory, parentCategory, subCategoryIndex);
  }, [onViewMore, subCategory, parentCategory, subCategoryIndex]);

  if (!enabled || isLoadingProducts) {
    return <RailPlaceholder title={subCategory.name} />;
  }

  // Keep a 0-height row instead of removing from the feed (avoids list jump).
  if (isEmpty) {
    return <View style={styles.emptyRail} />;
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
          {showViewMore ? (
            <TouchableOpacity onPress={handleViewMore} activeOpacity={0.7}>
              <Text style={styles.viewMore}>View more</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Max 8 cards — ScrollView avoids nested FlatList virtualization cost. */}
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
  rail: {
    backgroundColor: "#ffffff",
    paddingVertical: 16,
    marginBottom: 8,
    height: HOME_PRODUCT_RAIL_HEIGHT,
    overflow: "hidden",
  },
  emptyRail: {
    height: 0,
    marginBottom: 0,
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
    color: "#222",
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
