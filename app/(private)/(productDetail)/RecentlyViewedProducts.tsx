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

type Variant = "default" | "compact" | "mini";

type Props = {
  filterProductIds?: string[];
  scrollRef?: React.RefObject<ScrollView | null> | AnimatedRef<Animated.ScrollView>;
  variant?: Variant;
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

type CardItemProps = {
  item: RecentlyViewedItemType;
  variant: Variant;
  onPress: (id: string, item: RecentlyViewedItemType) => void;
};

const RecentlyViewedItem = memo(function RecentlyViewedItem({
  item,
  variant,
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

  const isCompact = variant === "compact";
  const isMini = variant === "mini";

  return (
    <TouchableOpacity
      style={[
        styles.item,
        isCompact && styles.compactItem,
        isMini && styles.miniItem,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${item.name}`}
    >
      <View
        style={[
          styles.card,
          isCompact && styles.compactCard,
          isMini && styles.miniCard,
        ]}
      >
        {hasDiscount && (
          <View style={[styles.discountBadge, isMini && styles.miniDiscountBadge]}>
            <ThemedText
              style={[
                styles.discountBadgeText,
                isMini && styles.miniDiscountBadgeText,
              ]}
            >
              {`${discountPercentage}% OFF`}
            </ThemedText>
          </View>
        )}

        <Image
          source={{ uri: item.image }}
          style={[
            styles.image,
            isCompact && styles.compactImage,
            isMini && styles.miniImage,
          ]}
          contentFit="contain"
          cachePolicy="memory-disk"
        />

        <View
          style={[
            styles.detailsContainer,
            isCompact && styles.compactDetails,
            isMini && styles.miniDetails,
          ]}
        >
          <ThemedText
            numberOfLines={isMini ? 1 : 2}
            style={[
              styles.name,
              isCompact && styles.compactName,
              isMini && styles.miniName,
            ]}
          >
            {item.name}
          </ThemedText>

          <View style={styles.priceContainer}>
            {hasDiscount ? (
              <>
                <ThemedText
                  style={[styles.discountedPrice, isMini && styles.miniPrice]}
                >
                  ₹{item.discountedPrice}
                </ThemedText>
                <ThemedText
                  style={[styles.originalPrice, isMini && styles.miniOriginalPrice]}
                >
                  ₹{item.price}
                </ThemedText>
              </>
            ) : (
              <ThemedText style={[styles.price, isMini && styles.miniPrice]}>
                ₹{item.price}
              </ThemedText>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const RecentlyViewedProducts = ({
  filterProductIds = [],
  scrollRef,
  variant = "default",
}: Props) => {
  const flatListRef = useRef<FlatList<RecentlyViewedItemType>>(null);

  const recentlyViewedRaw = useSelector(
    (state: RootState) =>
      (state as any)?.recentlyViewed?.items as
        | RecentlyViewedItemType[]
        | undefined,
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

  const navigateToProduct = useCallback(
    (id: string, item: RecentlyViewedItemType) => {
      router.push({
        pathname: "/(productDetail)/[id]" as any,
        params: {
          id,
          extraData: JSON.stringify(item),
        },
      });
    },
    [],
  );

  const keyExtractor = useCallback(
    (item: RecentlyViewedItemType) => item.id,
    [],
  );

  const isCompact = variant === "compact";
  const isMini = variant === "mini";

  if (!products.length) return null;

  const renderItem = ({ item }: ListRenderItemInfo<RecentlyViewedItemType>) => (
    <RecentlyViewedItem
      item={item}
      variant={variant}
      onPress={navigateToProduct}
    />
  );

  return (
    <View
      style={[
        styles.container,
        isCompact && styles.compactContainer,
        isMini && styles.miniContainer,
      ]}
    >
      <ThemedText
        style={[
          styles.title,
          isCompact && styles.compactTitle,
          isMini && styles.miniTitle,
        ]}
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
        contentContainerStyle={[
          styles.listContent,
          isMini && styles.miniListContent,
        ]}
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
  miniContainer: {
    marginVertical: 4,
    paddingVertical: 0,
    backgroundColor: "transparent",
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
  miniTitle: {
    fontSize: 15,
    marginBottom: 10,
    marginTop: 12,
    paddingHorizontal: 0,
    fontFamily: "Raleway_700Bold",
    color: Colors.light.darkGreen,
    letterSpacing: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  miniListContent: {
    paddingHorizontal: 0,
    paddingBottom: 4,
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
  miniItem: {
    width: 96,
    marginRight: 10,
    marginBottom: 0,
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
  miniCard: {
    borderRadius: 12,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  image: {
    height: 150,
    width: "100%",
    backgroundColor: "#ffffff",
  },
  compactImage: {
    height: 100,
  },
  miniImage: {
    height: 72,
  },
  detailsContainer: {
    padding: 16,
    backgroundColor: "#ffffff",
  },
  compactDetails: {
    padding: 8,
  },
  miniDetails: {
    padding: 6,
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
  miniName: {
    fontSize: 11,
    height: 16,
    lineHeight: 14,
    marginBottom: 4,
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
  miniPrice: {
    fontSize: 12,
  },
  miniOriginalPrice: {
    fontSize: 10,
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
  miniDiscountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderBottomLeftRadius: 10,
  },
  discountBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Montserrat_600SemiBold",
    letterSpacing: -0.2,
  },
  miniDiscountBadgeText: {
    fontSize: 9,
  },
});
