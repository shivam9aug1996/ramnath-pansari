import React, { memo, useCallback, useMemo } from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { ThemedText } from "@/components/ThemedText";
import { truncateText } from "@/utils/utils";
import { imageBorderStyle, staticImage } from "./utils";
import { arrayColor } from "./constants";
import { Category } from "@/types/global";
import { Colors } from "@/constants/Colors";
import { useDispatch } from "react-redux";
import { setSubCategoryActionClicked } from "@/redux/features/categorySlice";

interface Props {
  item: Category;
  index: number;
  isSelected: boolean;
  onSelectCategory?: (item: Category, index: number) => void;
  variant?: "small" | "large";
}

const IMAGE_SIZES = {
  small: 32,
  large: 60,
};

const MAX_WIDTHS = {
  small: 64,
  large: 80,
};

const FONT_SIZES = {
  small: 9,
  large: 12,
};

const TEXT_STYLES = {
  small: {
    fontSize: 9,
    textAlign: "center" as const,
    paddingHorizontal: 2,
    fontFamily: "Raleway_500Medium",
    color: Colors.light.mediumGrey,
  },
  large: {
    fontSize: 10,
    textAlign: "center" as const,
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
  const fontSize = FONT_SIZES[variant];
  const textStyle = TEXT_STYLES[variant];
  const borderStyle = useMemo(
    () => imageBorderStyle(arrayColor, isSelected, index),
    [isSelected, index]
  );

  const handlePress = useCallback(() => {
    if (!isSelected) {
      dispatch(setSubCategoryActionClicked(true));
    }
    onSelectCategory?.(item, index);
  }, [isSelected, item, index, onSelectCategory]);

  return (
    <TouchableOpacity
      style={[styles.container, { maxWidth }]}
      onPress={handlePress}
    >
      <View style={[styles.imageContainer, borderStyle]}>
        <Image
          source={{ uri: item.image || staticImage }}
          style={{ width: imageSize, height: imageSize }}
          contentFit="contain"
          placeholder={{ uri: staticImage }}
          cachePolicy="disk"
        />
      </View>
      <ThemedText style={[styles.text,{ ...textStyle},{ fontSize }]}>
        {truncateText(item.name, 15)}
      </ThemedText>
    </TouchableOpacity>
  );
};

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
  text: {
    fontSize: 9,
    textAlign: "center",
    paddingHorizontal: 2,
    fontFamily: "Raleway_500Medium",
    color: Colors.light.mediumGrey,
  },
});

export default memo(CategoryItem);
