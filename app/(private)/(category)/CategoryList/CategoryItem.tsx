import React, { memo, useCallback, useMemo } from "react";
import { TouchableOpacity, View, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { Image } from "expo-image";
import { useDispatch } from "react-redux";

import { ThemedText } from "@/components/ThemedText";
import { truncateText } from "@/utils/utils";
import { imageBorderStyle, staticImage } from "./utils";
import { arrayColor } from "./constants";
import { Category } from "@/types/global";
import { Colors } from "@/constants/Colors";
import { setSubCategoryActionClicked } from "@/redux/features/categorySlice";

type Variant = "small" | "large";

interface Props {
  item: Category;
  index: number;
  isSelected: boolean;
  onSelectCategory?: (item: Category, index: number) => void;
  variant?: Variant;
}

const IMAGE_SIZES: Record<Variant, number> = {
  small: 32,
  large: 60,
};

const MAX_WIDTHS: Record<Variant, number> = {
  small: 64,
  large: 80,
};

const TEXT_STYLES: Record<Variant, TextStyle> = {
  small: {
    fontSize: 9,
    textAlign: "center",
    paddingHorizontal: 2,
    fontFamily: "Raleway_500Medium",
    color: Colors.light.mediumGrey,
  },
  large: {
    fontSize: 10,
    textAlign: "center",
    paddingHorizontal: 5,
    fontFamily: "Raleway_600SemiBold",
    color: "#505050",
  },
};

const CategoryItem = ({
  item,
  index,
  isSelected,
  onSelectCategory,
  variant = "small",
}: Props) => {
  const dispatch = useDispatch();

  const imageSize = IMAGE_SIZES[variant];
  const maxWidth = MAX_WIDTHS[variant];
  const textStyle = TEXT_STYLES[variant];

  const borderStyle = useMemo(
    () => imageBorderStyle(arrayColor, isSelected, index),
    [isSelected, index],
  );

  const imageDimensionStyle = useMemo(
    () => ({ width: imageSize, height: imageSize }),
    [imageSize],
  );

  const containerStyle = useMemo(
    (): ViewStyle[] => [styles.container, { maxWidth }],
    [maxWidth],
  );

  const handlePress = useCallback(() => {
    if (!isSelected) {
      dispatch(setSubCategoryActionClicked(true));
    }
    onSelectCategory?.(item, index);
  }, [isSelected, item, index, onSelectCategory, dispatch]);

  const truncatedName = useMemo(
    () => truncateText(item.name, 15),
    [item.name],
  );

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={handlePress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Select category ${item.name}`}
    >
      <View style={[styles.imageContainer, borderStyle]}>
        <Image
          source={{ uri: item.image || staticImage }}
          style={imageDimensionStyle}
          contentFit="contain"
          placeholder={{ uri: staticImage }}
          cachePolicy="disk"
        />
      </View>
      <ThemedText style={textStyle}>
        {truncatedName}
      </ThemedText>
    </TouchableOpacity>
  );
};

export default memo(CategoryItem);

const styles = StyleSheet.create({
  container: {
    marginTop: 6,
    marginRight: 8,
    alignItems: "center",
  },
  imageContainer: {
    borderRadius: 10,
    marginBottom: 4,
    padding: 4,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});