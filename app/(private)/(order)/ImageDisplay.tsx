import { Image } from "expo-image";
import React from "react";
import { View, Text, StyleSheet } from "react-native";

const ImageDisplay = ({ images, count }) => {
  // const imagesToDisplay = images.slice(0, 3);
  // const remainingImagesCount = images.length > 3 ? images.length - 3 : 0;
  console.log(images);
  let im1 = images[0] && (
    <Image
      contentFit={"contain"}
      source={{ uri: images[0] }}
      style={{
        width: 30,
        padding: 2,
        margin: 2,
        height: 30,
      }}
    />
  );
  let im2 = images[1] && (
    <Image
      contentFit={"contain"}
      source={{ uri: images[1] }}
      style={{
        width: 30,
        padding: 2,
        margin: 2,
        height: 30,
      }}
    />
  );
  let im3 = images[2] && (
    <Image
      contentFit={"contain"}
      source={{ uri: images[2] }}
      style={{
        width: 30,
        padding: 2,
        margin: 2,
        height: 30,
      }}
    />
  );

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: "row" }}>
        {im1}
        {im2}
      </View>
      <View
        style={{ flexDirection: "row", marginTop: 4, alignItems: "center" }}
      >
        {im3}
        {count >= 1 && (
          <View
            style={{
              borderWidth: 1,
              borderRadius: 18,
              width: 30,
              height: 30,
              justifyContent: "center",
              alignItems: "center",
              padding: 2,
              margin: 2,
              marginLeft: 6,
            }}
          >
            <Text style={{ fontSize: count > 99 ? 10 : 11 }}>+{count}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    flex: 0.3,
    marginRight: 10,
    // alignItems: "center",
    // justifyContent: "center",
  },
});

export default ImageDisplay;
