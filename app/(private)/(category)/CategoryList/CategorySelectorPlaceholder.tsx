import { FlatList, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import React, { memo } from "react";
import { categoryListPlaceholder, imageBorderStyle } from "./utils";
import { arrayColor } from "./constants";
import ContentLoader, { Rect } from "react-content-loader/native";

const IMAGE_SIZES = {
  small: 35,
  large: 60,
};

const MAX_WIDTHS = {
  small: 70,
  large: 80,
};

const IMAGE_PADDING = {
  small: 15,
  large: 10,
};

const renderImageLoader = (size: number) => {
  return (
    <ContentLoader
      speed={2}
      width={size}
      height={size}
      backgroundColor="#f3f3f3"
      foregroundColor="#ecebeb"
    >
      <Rect rx={5} ry={5} width={size} height={size} />
    </ContentLoader>
  );
};

const renderText = () => {
  return (
    <ContentLoader
      speed={2}
      width={67}
      height={28.7}
      backgroundColor="#f3f3f3"
      foregroundColor="#ecebeb"
      style={{
        alignSelf: "center",
      }}
    >
      <Rect rx={5} ry={5} width="67" y={0} height="10" />
      <Rect rx={5} ry={5} width="67" y={14} height="10" />
    </ContentLoader>
  );
};

const CategorySelectorPlaceholder = ({
  contentContainerStyle = {},
  variant = "small",
}: {
  contentContainerStyle?: object;
  variant?: "small" | "large";
}) => {
  const imageSize = IMAGE_SIZES[variant];
  const maxWidth = MAX_WIDTHS[variant];
  const imagePadding = IMAGE_PADDING[variant];

  const renderCategory = ({ item, index }: { item: any; index: number }) => {
    const borderStyle = imageBorderStyle(arrayColor, false, index);
    return (
      <TouchableOpacity
        key={item?._id || index}
        style={[styles.categoryContainer, { maxWidth }]}
      >
        <View
          style={[
            styles.imageContainer,
            borderStyle,
            {
              paddingVertical: imagePadding,
              paddingHorizontal: imagePadding,
            },
          ]}
        >
          {renderImageLoader(imageSize)}
        </View>
        {renderText()}
      </TouchableOpacity>
    );
  };
  return (
    <FlatList
    bounces={Platform.OS === "android" ? false : true}
      contentContainerStyle={contentContainerStyle}
      data={categoryListPlaceholder}
      horizontal
      keyExtractor={(item) => item?._id}
      showsHorizontalScrollIndicator={false}
      renderItem={renderCategory}
    />
  );
};

export default memo(CategorySelectorPlaceholder);

const styles = StyleSheet.create({
  categoryContainer: {
    marginTop: 15,
    marginRight: 10,
  },
  imageContainer: {
    borderRadius: 23,
    marginBottom: 8,
    borderWidth: 1,
  },
  image: {
    height: 35,
    width: 35,
  },
  categoryText: {
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 5,
  },
});
