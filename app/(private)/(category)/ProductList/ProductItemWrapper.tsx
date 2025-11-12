import { StyleSheet, Text, View } from "react-native";
import React, { memo, useMemo } from "react";
import ProductItem from "./ProductItem";
import { CartItem, Product, RootState } from "@/types/global";
import { useSelector } from "react-redux";
import { useFetchCartQuery } from "@/redux/features/cartSlice";

const ProductItemWrapper = ({
  item,
  index,
  quantity,
}: {
  item: Product;
  index: number;
  quantity: number;
}) => {
    
  //   const userId = useSelector((state: RootState) => state?.auth?.userData?._id);
  // const { data: cartData, isLoading: isCartLoading } = useFetchCartQuery(
  //   { userId },
  //   { skip: !userId }
  // );
  // const cartItemsMap = useMemo(() => {
  //   console.log("cartDatashivam---------->");
  //   const map: Record<string, CartItem> = {};
  //   (cartData?.cart?.items || []).forEach((it) => {
  //     map[it.productId] = it;
  //   });
  //   return map;
  // }, [cartData?.cart?.items]);
  // const cartItem = cartItemsMap[item._id];
  console.log("quant67890987654ity---------->");

 
  return (
    <ProductItem
      key={item?._id || index}
      item={item}
      index={index}
      quantity={quantity}
    />
  );
};

export default memo(ProductItemWrapper);

const styles = StyleSheet.create({});
