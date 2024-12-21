import { Image } from "expo-image";
import React from "react";
import { View, Text, StyleSheet } from "react-native";

const ImageDisplay = ({ images, count }) => {
  const renderImage = (uri, key) => (
    <Image
      key={key}
      contentFit="contain"
      source={{ uri }}
      style={styles.image}
    />
  );

  return (
    <View style={styles.container}>
      {/* First Row */}
      <View style={styles.row}>
        {images.slice(0, 2).map((uri, index) => renderImage(uri, index))}
      </View>

      {/* Second Row */}
      <View style={[styles.row, styles.secondRow]}>
        {images[2] && renderImage(images[2], 2)}
        {count >= 1 && (
          <View style={styles.countContainer}>
            <Text
              style={[styles.countText, { fontSize: count > 99 ? 10 : 11 }]}
            >
              +{count}
            </Text>
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
  },
  row: {
    flexDirection: "row",
  },
  secondRow: {
    marginTop: 4,
    alignItems: "center",
  },
  image: {
    width: 30,
    height: 30,
    margin: 2,
    borderRadius: 5,
  },
  countContainer: {
    borderWidth: 1,
    borderRadius: 18,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    margin: 2,
    marginLeft: 6,
  },
  countText: {
    textAlign: "center",
  },
});

export default ImageDisplay;
