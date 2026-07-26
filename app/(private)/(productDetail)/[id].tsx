import { StyleSheet } from "react-native";
import React from "react";
import { useLocalSearchParams } from "expo-router";
import AppHead from "@/components/AppHead";
import ProductDetail from "./ProductDetail";
import { getProductTitleFromExtraData } from "@/utils/appHeadUtils";

const Product = () => {
  const { id, extraData } = useLocalSearchParams<{
    id: string;
    extraData: any;
  }>();

  return (
    <>
      <AppHead title={getProductTitleFromExtraData(extraData)} />
      <ProductDetail id={id} extraData={extraData} />
    </>
  );
};

export default Product;

const styles = StyleSheet.create({});
