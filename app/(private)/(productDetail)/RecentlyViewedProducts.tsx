import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ListRenderItemInfo,
} from "react-native";
import Animated, { AnimatedRef, scrollTo } from "react-native-reanimated";
import { useSelector } from "react-redux";
import { Image } from "expo-image";
import { router } from "expo-router";

import { RootState } from "@/types/global";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";

type Props = {
  filterProductIds?: string[];
  scrollRef?: React.RefObject<ScrollView | null> | AnimatedRef<Animated.ScrollView>;
  variant?: "default" | "compact";
};

type RecentlyViewedItemType = {
  id: string;
  type?: string;
  name?: string;
  image?: string;
  price?: number;
  discountedPrice?: number;
  [key: string]: any;
};

// --- Sub-component for individual card ---

type CardItemProps = {
  item: RecentlyViewedItemType;
  isCompact: boolean;
  onPress: (id: string, item: RecentlyViewedItemType) => void;
};

const RecentlyViewedItem = memo(function RecentlyViewedItem({
  item,
  isCompact,
  onPress,
}: CardItemProps) {
  const handlePress = useCallback(() => {
    onPress(item.id, item);
  }, [onPress, item]);

  const hasDiscount =
    Boolean(item.discountedPrice) && item.discountedPrice !== item.price;

  const discountPercentage = useMemo(() => {
    if (!hasDiscount || !item.price || !item.discountedPrice) return 0;
    return Math.round(((item.price - item.discountedPrice) / item.price) * 100);
  }, [hasDiscount, item.price, item.discountedPrice]);

  return (
    <TouchableOpacity
      style={[styles.item, isCompact && styles.compactItem]}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${item.name}`}
    >
      <View style={[styles.card, isCompact && styles.compactCard]}>
        {hasDiscount && (
          <View style={styles.discountBadge}>
            <ThemedText style={styles.discountBadgeText}>
              {`${discountPercentage}% OFF`}
            </ThemedText>
          </View>
        )}

        <Image
          source={{ uri: item.image }}
          style={[styles.image, isCompact && styles.compactImage]}
          contentFit="contain"
          cachePolicy="memory-disk"
        />

        <View
          style={[
            styles.detailsContainer,
            isCompact && styles.compactDetails,
          ]}
        >
          <ThemedText
            numberOfLines={2}
            style={[styles.name, isCompact && styles.compactName]}
          >
            {item.name}
          </ThemedText>

          <View style={styles.priceContainer}>
            {hasDiscount ? (
              <>
                <ThemedText style={styles.discountedPrice}>
                  ₹{item.discountedPrice}
                </ThemedText>
                <ThemedText style={styles.originalPrice}>
                  ₹{item.price}
                </ThemedText>
              </>
            ) : (
              <ThemedText style={styles.price}>₹{item.price}</ThemedText>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// --- Main Component ---

const RecentlyViewedProducts = ({
  filterProductIds = [],
  scrollRef,
  variant = "default",
}: Props) => {
  const flatListRef = useRef<FlatList<RecentlyViewedItemType>>(null);

  const recentlyViewedRaw = useSelector(
    (state: RootState) => (state as any)?.recentlyViewed?.items as RecentlyViewedItemType[] | undefined,
  );

  const products = useMemo(() => {
    if (!recentlyViewedRaw?.length) return [];
    return recentlyViewedRaw.filter(
      (item) =>
        item?.type === "product" &&
        !filterProductIds.includes(item?.id) &&
        Boolean(item?.name),
    );
  }, [recentlyViewedRaw, filterProductIds]);

  useEffect(() => {
    if (products.length > 0) {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      if (scrollRef) {
        scrollTo(scrollRef, 0, 0, true);
      }
    }
  }, [products.length, scrollRef]);

  const navigateToProduct = useCallback((id: string, item: RecentlyViewedItemType) => {
    router.push({
      pathname: "/(productDetail)/[id]" as any,
      params: {
        id,
        extraData: JSON.stringify(item),
      },
    });
  }, []);

  const keyExtractor = useCallback((item: RecentlyViewedItemType) => item.id, []);

  const isCompact = variant === "compact";

  if (!products.length) return null;

  const renderItem = ({ item }: ListRenderItemInfo<RecentlyViewedItemType>) => (
    <RecentlyViewedItem
      item={item}
      isCompact={isCompact}
      onPress={navigateToProduct}
    />
  );

  return (
    <View style={[styles.container, isCompact && styles.compactContainer]}>
      <ThemedText
        style={[styles.title, isCompact && styles.compactTitle]}
        type="title"
      >
        Recently Viewed
      </ThemedText>

      <FlatList
        ref={flatListRef}
        horizontal
        data={products}
        keyExtractor={keyExtractor}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={renderItem}
      />
    </View>
  );
};

export default memo(RecentlyViewedProducts);

const styles = StyleSheet.create({
  container: {
    marginVertical: 24,
    backgroundColor: "#ffffff",
  },
  compactContainer: {
    marginVertical: 12,
    paddingVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    paddingHorizontal: 20,
    fontFamily: "Montserrat_600SemiBold",
    color: "#1a1a1a",
    letterSpacing: -0.5,
  },
  compactTitle: {
    fontSize: 18,
    marginBottom: 24,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  item: {
    width: 180,
    marginRight: 20,
    marginBottom: 12,
  },
  compactItem: {
    width: 130,
    marginRight: 14,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 5,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  compactCard: {
    borderRadius: 12,
  },
  image: {
    height: 150,
    width: "100%",
    backgroundColor: "#ffffff",
  },
  compactImage: {
    height: 100,
  },
  detailsContainer: {
    padding: 16,
    backgroundColor: "#ffffff",
  },
  compactDetails: {
    padding: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    height: 44,
    fontFamily: "Montserrat_600SemiBold",
    color: "#2d2d2d",
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  compactName: {
    fontSize: 13,
    height: 36,
    lineHeight: 18,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  discountedPrice: {
    fontSize: 18,
    color: Colors.light.lightGreen,
    fontWeight: "700",
    fontFamily: "Montserrat_600SemiBold",
    letterSpacing: -0.3,
  },
  originalPrice: {
    fontSize: 15,
    color: "#999999",
    fontWeight: "500",
    textDecorationLine: "line-through",
    fontFamily: "Montserrat_600SemiBold",
    letterSpacing: -0.3,
  },
  price: {
    fontSize: 18,
    color: Colors.light.lightGreen,
    fontWeight: "700",
    fontFamily: "Montserrat_600SemiBold",
    letterSpacing: -0.3,
  },
  discountBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: Colors.light.lightGreen,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 16,
    zIndex: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  discountBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Montserrat_600SemiBold",
    letterSpacing: -0.2,
  },
});