import React, { memo } from "react";
import { FlatList, TouchableOpacity, View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { truncateText } from "@/utils/utils";
import { imageBorderStyle, staticImage } from "./utils";
import { arrayColor } from "./constants";
import { Category, CategorySelectorProps } from "@/types/global";
import { Image } from "expo-image";
import { Colors } from "@/constants/Colors";

const CategorySelector = ({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategorySelectorProps) => {
  const renderCategory = ({
    item,
    index,
  }: {
    item: Category;
    index: number;
  }) => {
    const borderStyle = imageBorderStyle(
      arrayColor,
      item?._id === selectedCategory?._id,
      index
    );

    return (
      <TouchableOpacity
        style={styles.categoryContainer}
        onPress={() => {
          onSelectCategory?.(item);
        }}
        key={item?._id || index}
      >
        <View style={[styles.imageContainer, borderStyle]}>
          <Image
            source={{ uri: item?.image || staticImage }}
            style={styles.image}
            contentFit={"cover"}
            placeholder={{ uri: staticImage }}
            cachePolicy={"disk"}
          />
        </View>
        <ThemedText style={styles.categoryText}>
          {truncateText(item?.name, 15)}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={categories}
      horizontal
      keyExtractor={(item) => item?._id}
      showsHorizontalScrollIndicator={false}
      renderItem={renderCategory}
    />
  );
};

const styles = StyleSheet.create({
  categoryContainer: {
    maxWidth: 70,
    marginTop: 15,
    marginRight: 10,
  },
  imageContainer: {
    borderRadius: 23,
    marginBottom: 8,
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
  },
  image: {
    height: 35,
    width: 35,
  },
  categoryText: {
    fontSize: 10,
    textAlign: "center",
    paddingHorizontal: 5,
    fontFamily: "Raleway_500Medium",

    color: Colors.light.mediumGrey,
  },
});

export default memo(CategorySelector);
