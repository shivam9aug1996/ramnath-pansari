import React, { memo } from "react";
import { FlatList, Platform } from "react-native";
import CategoryItem from "./CategoryItem";
import { CategorySelectorProps } from "@/types/global";

const CategorySelector = ({
  categories,
  selectedCategory,
  onSelectCategory,
  contentContainerStyle,
}: CategorySelectorProps) => {
  console.log("categoriesseclector---->",categories);
  const renderCategory = ({ item, index }: { item: any; index: number }) => {
    const isSelected = item._id === selectedCategory?._id;
    return (
      <CategoryItem
        item={item}
        index={index}
        isSelected={isSelected}
        onSelectCategory={onSelectCategory}
      />
    );
  };

  return (
    <FlatList
      horizontal
      bounces={Platform.OS !== "android"}
      contentContainerStyle={contentContainerStyle}
      data={categories}
      keyExtractor={(item) => item._id}
      renderItem={renderCategory}
      showsHorizontalScrollIndicator={false}
    />
  );
};

export default memo(CategorySelector);
