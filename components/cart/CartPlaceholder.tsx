import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { Colors } from "@/constants/Colors";
import { ThemedView } from "../ThemedView";
import ContentLoader, { Rect } from "react-content-loader/native";

const renderImageLoader = () => {
  return (
    <ContentLoader
      speed={1}
      height={50}
      width={50}
      backgroundColor="#f3f3f3"
      foregroundColor="#e3e3e3"
      style={{
        minHeight: 50,
        minWidth: 50,
        borderRadius: 18,
      }}
    >
      <Rect rx={5} ry={5} width="78" height="88" />
    </ContentLoader>
  );
};

const renderText = () => {
  return (
    <ContentLoader
      speed={1}
      width={"100%"}
      height={100}
      backgroundColor="#f3f3f3"
      foregroundColor="#e3e3e3"
    >
      <Rect width="90%" y={0} rx={5} ry={5} height="10" />
      <Rect width="50%" y={25} rx={5} ry={5} height="10" />
      <Rect width="50%" y={50} rx={5} ry={5} height="10" />
    </ContentLoader>
  );
};

const CartPlaceholder = ({ wrapperStyle = {}, count = 4 }) => {
  const data = Array.from({ length: count }, (_, index) => index + 1);

  return (
    <View
      style={[{ flex: 0.9, paddingHorizontal: 16, paddingTop: 12 }, wrapperStyle]}
    >
      {data.map((item, index) => (
        <ThemedView key={index} style={[styles.container]}>
          <View style={styles.imageContainer}>{renderImageLoader()}</View>
          <View style={styles.detailsContainer}>{renderText()}</View>
        </ThemedView>
      ))}
    </View>
  );
};

export default CartPlaceholder;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#F1F4F3",
    padding: 20,
    borderRadius: 23,
    flex: 1,
    justifyContent: "flex-start",
    marginBottom: 18, // Add spacing between items
  },
  imageContainer: {
    flex: 0.35,
  },
  detailsContainer: {
    justifyContent: "space-evenly",
    flex: 1,
    marginLeft: 12,
  },
});
