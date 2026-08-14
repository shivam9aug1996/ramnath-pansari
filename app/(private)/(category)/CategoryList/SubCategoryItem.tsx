import React, { memo } from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { SubCategory } from "@/types/global";
import { useDispatch } from "react-redux";
import { setSubCategoryActionClicked } from "@/redux/features/categorySlice";

interface Props {
  item: SubCategory;
  isSelected: boolean;
  onPress: (item: SubCategory) => void;
}

const SubCategoryItem = ({ item, isSelected, onPress }: Props) => {
  const dispatch = useDispatch();

  const handlePress = () => {
    if (!isSelected) {
      dispatch(setSubCategoryActionClicked(true));
    }
    onPress(item);
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: isSelected ? Colors.light.mediumGreen : Colors.light.lightGrey },
      ]}
      onPress={handlePress}
    >
      <ThemedText
        style={[
          styles.text,
          { color: isSelected ? Colors.light.white : Colors.light.darkGrey },
        ]}
      >
        {item.name}
      </ThemedText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: 8,
    marginBottom: 6,
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  text: {
    fontSize: 12,
  },
});

export default memo(SubCategoryItem);