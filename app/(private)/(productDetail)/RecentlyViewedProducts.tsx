import React, { useRef } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "@/types/global";
import { ThemedText } from "@/components/ThemedText";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Colors } from "@/constants/Colors";

type Props = {
  filterProductIds?: string[];
  scrollRef?: React.RefObject<ScrollView>;
  variant?: "default" | "compact";
};

const RecentlyViewedProducts = ({
  filterProductIds = [],
  scrollRef,
  variant = "default",
}: Props) => {
  const flatListRef = useRef<FlatList>(null);
  const recentlyViewed = useSelector(
    (state: RootState) => state?.recentlyViewed?.items
  );

  const productItems = recentlyViewed?.filter(
    (item) =>
      item?.type === "product" &&
      !filterProductIds?.includes(item?.id) &&
      item?.name
  );

  const navigateToProduct = (id: string, item: any) => {
    router.push({
      pathname: "/(productDetail)/[id]",
      params: {
        id,
        extraData: JSON.stringify(item),
      },
    });
    //router.navigate(`/(productDetail)/${item.id}?extraData=${encodeURIComponent(JSON.stringify(item))}`)
   // });


    setTimeout(() => {
      scrollRef?.current?.scrollTo({ y: 0, animated: false });
      flatListRef.current?.scrollToIndex({ index: 0, animated: false });
    }, 100);
  };

  if (!productItems || productItems.length === 0) return null;

  const isCompact = variant === "compact";

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
        data={productItems}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.item, isCompact && styles.compactItem]}
            onPress={() => navigateToProduct(item.id, item)}
            activeOpacity={0.7}
          >
            <View style={[styles.card, isCompact && styles.compactCard]}>
              {item.discountedPrice && item.discountedPrice !== item.price && (
                <View style={styles.discountBadge}>
                  <ThemedText style={styles.discountBadgeText}>
                    {(() => {
                      const nDiscountP =
                        ((item.price - item.discountedPrice) / item.price) *
                        100;
                      return `${Math.round(nDiscountP)}% OFF`;
                    })()}
                  </ThemedText>
                </View>
              )}
              <Image
                source={{ uri: item.image }}
                style={[styles.image, isCompact && styles.compactImage]}
                contentFit="contain"
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
                  {item.discountedPrice &&
                  item.discountedPrice !== item.price ? (
                    <>
                      <ThemedText style={styles.discountedPrice}>
                        ₹{item.discountedPrice}
                      </ThemedText>
                      <ThemedText style={styles.originalPrice}>
                        ₹{item.price}
                      </ThemedText>
                    </>
                  ) : (
                    <ThemedText style={styles.price}>
                      ₹{item.price}
                    </ThemedText>
                  )}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 24,
    backgroundColor: "#ffffff",
  },
  compactContainer: {
    marginVertical: 12,
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
    marginBottom: 12,
    paddingHorizontal: 16,
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
    shadowColor: "#000",
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
    color: "#999",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  discountBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Montserrat_600SemiBold",
    letterSpacing: -0.2,
  },
});

export default RecentlyViewedProducts;
