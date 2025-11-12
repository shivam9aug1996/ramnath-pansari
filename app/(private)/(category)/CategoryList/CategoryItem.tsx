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
  small: 40,
  large: 60,
};

const MAX_WIDTHS = {
  small: 70,
  large: 80,
};

const FONT_SIZES = {
  small: 10,
  large: 12,
};

const TEXT_STYLES = {
  small: {
    fontSize: 10,
    textAlign: "center",
    paddingHorizontal: 5,
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
          contentFit="cover"
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
    marginTop: 15,
    marginRight: 10,
  },
  imageContainer: {
    borderRadius: 23,
    marginBottom: 8,
    padding: 10,
    borderWidth: 1,
  },
  text: {
    fontSize: 10,
    textAlign: "center",
    paddingHorizontal: 5,
    fontFamily: "Raleway_500Medium",
    color: Colors.light.mediumGrey,
  },
});

export default memo(CategoryItem);
