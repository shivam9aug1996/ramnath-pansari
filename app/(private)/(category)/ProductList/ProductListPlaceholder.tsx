import { FlatList, Platform, StyleSheet, Text, View } from "react-native";
import React, { memo, useRef } from "react";
import { productPlaceholderData } from "./utils";
import { Product } from "@/types/global";
import { Colors } from "@/constants/Colors";
import ContentLoader, { Rect } from "react-content-loader/native";

const renderImageLoader = () => {
  return (
    <ContentLoader
      speed={1}
      height={120}
      width={"100%"}
      backgroundColor="#f3f3f3"
      foregroundColor="#e3e3e3"
      style={{ marginBottom: 10 }}
    >
      <Rect rx={5} ry={5} width="100%" height="135" />
    </ContentLoader>
  );
};

const renderText = () => {
  return (
    <ContentLoader
      speed={1}
      width={70}
      height={80}
      backgroundColor="#f3f3f3"
      foregroundColor="#e3e3e3"
    >
      <Rect width="70" y={0} rx={5} ry={5} height="20" />
      <Rect width="40" y={35} rx={5} ry={5} height="20" />
    </ContentLoader>
  );
};

const ProductsPlaceholder = ({ wrapperStyle = {} }) => {
  const renderProductItem = ({
    item,
    index,
  }: {
    item: Product;
    index: number;
  }) => {
    return (
      <View
        key={index}
        style={[
          styles.container,
          {
            marginRight: index % 2 === 0 ? 17 : 0,
          },
        ]}
      >
        <View style={{ padding: 17 }}>
          <View>
            {renderImageLoader()}
            {renderText()}
          </View>
        </View>
      </View>
    );
  };

  return (
    <FlatList
    bounces={Platform.OS === "android" ? false : true}
      showsVerticalScrollIndicator={false}
      numColumns={2}
      data={productPlaceholderData}
      keyExtractor={(item) => item._id}
      renderItem={renderProductItem}
      style={[styles.flatList, wrapperStyle]}
    />
  );
};

export default memo(ProductsPlaceholder);

const styles = StyleSheet.create({
  flatList: {
    overflow: "hidden",
    //marginBottom: 60,
    marginTop: 10,
  },
  container: {
    backgroundColor: "#F1F4F3",
    borderRadius: 28,
    flex: 1 / 2,
    marginBottom: 20,
    position: "relative",
    minHeight: 250,
  },
  image: {
    height: 120,
    // marginBottom: 10,
  },
  productName: {
    fontSize: 14,
    maxWidth: 70,
  },
  productPrice: {
    fontSize: 14,
    fontFamily: "Montserrat_600SemiBold",
    color: Colors.light.lightGreen,
    marginTop: 8,
  },
});
