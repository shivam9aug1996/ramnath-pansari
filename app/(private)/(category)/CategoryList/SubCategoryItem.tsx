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
    console.log("item123456789888---->",item);
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
    marginRight: 10,
    marginBottom: 10,
    marginTop: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  text: {
    fontSize: 14,
  },
});

export default memo(SubCategoryItem);
