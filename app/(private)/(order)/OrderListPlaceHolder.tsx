import { FlatList, Platform, StyleSheet, Text, View } from "react-native";
import React, { memo } from "react";
import { Colors } from "@/constants/Colors";
import ContentLoader, { Rect } from "react-content-loader/native";

const renderImageLoader = () => {
  return (
    <ContentLoader
      speed={1}
      height={72}
      width={"70"}
      backgroundColor="#f3f3f3"
      foregroundColor="#e3e3e3"
      style={{ marginBottom: 10 }}
    >
      <Rect rx={5} ry={5} width="70" height="72" />
    </ContentLoader>
  );
};

const renderText = () => {
  return (
    <ContentLoader
      speed={1}
      width={"70%"}
      height={80}
      backgroundColor="#f3f3f3"
      foregroundColor="#e3e3e3"
    >
      <Rect width="100%" y={0} rx={5} ry={5} height="20" />
      <Rect width="100%" y={35} rx={5} ry={5} height="20" />
    </ContentLoader>
  );
};

const OrderListPlaceHolder = () => {
  const renderProductItem = ({
    item,
    index,
  }: {
    item: { _id: number };
    index: number;
  }) => {
    return (
      <View style={[styles.container]} key={index}>
        <View style={{ padding: 17, flexDirection: "row", flex: 1 }}>
          {renderImageLoader()}
          {renderText()}
        </View>
      </View>
    );
  };

  return (
    <FlatList
    bounces={Platform.OS === "android" ? false : true}
      showsVerticalScrollIndicator={false}
      data={[
        {
          _id: 1,
        },
        {
          _id: 2,
        },
        {
          _id: 3,
        },
        {
          _id: 4,
        },
        {
          _id: 5,
        },
        {
          _id: 6,
        },
      ]}
      keyExtractor={(item, index) => item._id}
      renderItem={renderProductItem}
      style={styles.flatList}
    />
  );
};

export default memo(OrderListPlaceHolder);

const styles = StyleSheet.create({
  flatList: {
    // overflow: "hidden",
    //marginBottom: 60,
    marginTop: 10,
  },
  container: {
    backgroundColor: "#F1F4F3",
    borderRadius: 28,
    // flex: 1 / 2,
    marginBottom: 20,
    position: "relative",
    minHeight: 50,
  },
  image: {
    height: 50,
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
