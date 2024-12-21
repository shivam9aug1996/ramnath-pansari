import { StyleSheet, Text, View } from "react-native";
import React, { memo } from "react";
import { Category } from "@/types/global";
import CategorySelector from "@/app/(private)/(category)/CategoryList/CategorySelector";
import { imageBorderStyle } from "@/app/(private)/(category)/CategoryList/utils";
import { arrayColor } from "@/app/(private)/(category)/CategoryList/constants";
import { Colors } from "@/constants/Colors";

const CategoryCard = ({
  category,
  onSelect,
}: {
  category: Category;
  onSelect: any;
}) => {
  const borderStyle = imageBorderStyle(arrayColor, false, Math.random());
  return (
    <View style={styles.categoryCard}>
      <View style={[styles.categoryTitleContainer, borderStyle]}>
        <Text style={styles.categoryTitleText}>{category?.name}</Text>
      </View>
      <CategorySelector
        categories={category?.children}
        onSelectCategory={(data) => onSelect(data, category)}
      />
    </View>
  );
};

export default memo(CategoryCard);

const styles = StyleSheet.create({
  categoryCard: {
    flex: 1,
    flexDirection: "column",
    marginBottom: 40,
  },
  categoryTitleContainer: {
    borderRadius: 23,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  categoryTitleText: {
    fontFamily: "Raleway_500Medium",
    fontSize: 12,
    color: Colors.light.mediumGrey,
  },
});
