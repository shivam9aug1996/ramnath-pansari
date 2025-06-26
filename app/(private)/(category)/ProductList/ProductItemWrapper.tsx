import { StyleSheet, Text, View } from "react-native";
import React, { useMemo } from "react";
import ProductItem from "./ProductItem";
import { CartItem, Product, RootState } from "@/types/global";
import { useSelector } from "react-redux";
import { useFetchCartQuery } from "@/redux/features/cartSlice";

const ProductItemWrapper = ({
  item,
  index,
}: {
  item: Product;
  index: number;
}) => {
    const userId = useSelector((state: RootState) => state?.auth?.userData?._id);
  const { data: cartData, isLoading: isCartLoading } = useFetchCartQuery(
    { userId },
    { skip: !userId }
  );
  const cartItemsMap = useMemo(() => {
    const map: Record<string, CartItem> = {};
    (cartData?.cart?.items || []).forEach((it) => {
      map[it.productId] = it;
    });
    return map;
  }, [cartData?.cart?.items]);
  const cartItem = cartItemsMap[item._id];
  return (
    <ProductItem
      key={item?._id || index}
     // cartItem={cartItem}
      item={item}
      index={index}
      quantity={cartItem?.quantity}
    />
  );
};

export default ProductItemWrapper;

const styles = StyleSheet.create({});
