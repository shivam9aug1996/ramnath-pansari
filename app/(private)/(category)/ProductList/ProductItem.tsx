import React, { lazy, memo, Suspense, useCallback, useMemo } from "react";
import { View, StyleSheet, Text, TouchableOpacity, GestureResponderEvent } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { formatNumber } from "@/utils/utils";
import { ProductItemProps } from "@/types/global";
import { staticImage } from "../CategoryList/utils";
import { Image } from "expo-image";
import { router } from "expo-router";
import CartButton from "./CartButton";
import ProductImage from "./ProductImage";
import DiscountBadge from "./DiscountBadge";
import DeferredFadeIn from "@/components/DeferredFadeIn";




const ProductItem = ({
  item,
  index,
  cartItem,
  //isCartLoading,
  //isProductsFetching,
  //paginationState,
}: ProductItemProps) => {
  const discountPercentage = useMemo(() => {
    const nDiscountP = ((item.price - item.discountedPrice) / item.price) * 100;
    return Math.round(nDiscountP);
  }, [item.price, item.discountedPrice]);

  // const isDisabled = useMemo(() => 
  //   (isProductsFetching && paginationState?.page === 1),
  //   [isProductsFetching, paginationState?.page]
  // );

  const handleProductPress = useCallback((e: GestureResponderEvent) => {
    e?.isPropagationStopped();
    router.navigate({
      pathname: "/(productDetail)/[id]",
      params: {
        id: item?._id,
        extraData:JSON.stringify(item)
      },
    });
  }, [item?._id]);

  const containerStyle = useMemo(() => [
    styles.container,
    {
      marginRight: index % 2 === 0 ? 8.5 : 0,
      marginLeft: index % 2 === 0 ? 0 : 8.5,
      //opacity: isDisabled ? 0.6 : 1,  
    }
  ], [index]);

  return (
    <View
      style={containerStyle}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, Price: ₹${formatNumber(item.discountedPrice)}`}
    >
      <DiscountBadge discount={discountPercentage} />

      <TouchableOpacity
        onPress={handleProductPress}
        style={styles.productContent}
        activeOpacity={0.7}
      >
        <ProductImage image={item?.image} />
        
        <ThemedText 
          style={styles.productName} 
          type="title"
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {item.name}
        </ThemedText>

        <ThemedText 
          style={styles.mrpPrice} 
          type="title"
          numberOfLines={1}
        >
          {`MRP ₹ ${formatNumber(item.price)}`}
        </ThemedText>

        <View style={styles.priceContainer}>
          <ThemedText style={styles.productPrice} type="title">
            {`₹ ${formatNumber(item.discountedPrice)}`}
          </ThemedText>
        </View>
      </TouchableOpacity>

      <View style={styles.cartButtonSpacing} />

      
       <CartButton value={cartItem?.quantity || 0} item={item} />
       
      
    </View>
  );
};

export default memo(ProductItem);

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.softGrey_1,
    borderRadius: 28,
    flex: 1,
    position: "relative",
    maxWidth: "50%",
  },
  discountBadge: {
    position: "absolute",
    backgroundColor: Colors.light.lightGreen,
    zIndex: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    left: 10,
    top: 10,
    borderRadius: 4,
  },
  discountText: {
    color: Colors.light.white,
    fontSize: 12,
    fontFamily: "Montserrat_700Bold",
  },
  productContent: {
    padding: 17,
  },
  productName: {
    fontSize: 11,
    maxWidth: "100%",
    marginBottom: 4,
    minHeight: 28,
    lineHeight: 14,
  },
  mrpPrice: {
    textDecorationLine: "line-through",
    textDecorationColor: Colors.light.darkGrey,
    fontSize: 12,
    color: Colors.light.darkGrey,
    marginBottom: 4,
    minHeight: 16,
    lineHeight: 16,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  productPrice: {
    fontSize: 14,
    fontFamily: "Montserrat_600SemiBold",
    color: Colors.light.lightGreen,
  },
  cartButtonSpacing: {
    marginTop: 35,
  },
});
