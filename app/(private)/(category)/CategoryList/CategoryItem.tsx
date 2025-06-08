import React, { memo } from "react";
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
}

const CategoryItem = ({ item, index, isSelected, onSelectCategory }: Props) => {
  const dispatch = useDispatch();
  const borderStyle = imageBorderStyle(arrayColor, isSelected, index);

  const handlePress = () => {
    if (!isSelected) {
      dispatch(setSubCategoryActionClicked(true));
    }
    onSelectCategory?.(item, index);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={[styles.imageContainer, borderStyle]}>
        <Image
          source={{ uri: item.image || staticImage }}
          style={styles.image}
          contentFit="cover"
          placeholder={{ uri: staticImage }}
          cachePolicy="disk"
        />
      </View>
      <ThemedText style={styles.text}>
        {truncateText(item.name, 15)}
      </ThemedText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: 70,
    marginTop: 15,
    marginRight: 10,
  },
  imageContainer: {
    borderRadius: 23,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  image: {
    height: 40,
    width: 40,
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
