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
  const categoryIndex = category?.id ? category.id % arrayColor.length : 0;
  const borderStyle = imageBorderStyle(arrayColor, false, categoryIndex);
  
  return (
    <View style={styles.categoryCard}>
      <View style={[styles.categoryTitleContainer, borderStyle]}>
        <Text style={styles.categoryTitleText}>{category?.name}</Text>
      </View>
      <View style={styles.childrenContainer}>
        <CategorySelector
          categories={category?.children}
          onSelectCategory={(data, index) => onSelect(data, category, index)}
        />
      </View>
    </View>
  );
};

export default memo(CategoryCard);

const styles = StyleSheet.create({
  categoryCard: {
    flex: 1,
    flexDirection: "column",
    //marginBottom: 40,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    paddingHorizontal:0
  },
  categoryTitleContainer: {
    borderRadius: 23,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  categoryTitleText: {
    fontFamily: "Raleway_600SemiBold",
    fontSize: 14,
    color: Colors.light.mediumGrey,
  },
  childrenContainer: {
    marginTop: 8,
  },
});
