import React, { memo } from "react";
import { FlatList, Platform } from "react-native";
import CategoryItem from "./CategoryItem";
import { CategorySelectorProps } from "@/types/global";

const CategorySelector = ({
  categories,
  selectedCategory,
  onSelectCategory,
  contentContainerStyle,
  variant = "small",
  flatListRef,
}: CategorySelectorProps) => {
  const renderCategory = ({ item, index }: { item: any; index: number }) => {
    const isSelected = item._id === selectedCategory?._id;
    return (
      <CategoryItem
        item={item}
        index={index}
        isSelected={isSelected}
        onSelectCategory={onSelectCategory}
        variant={variant}
      />
    );
  };

  return (
    <FlatList
      ref={flatListRef}
      nestedScrollEnabled={true}
      horizontal
      bounces={Platform.OS !== "android"}
      contentContainerStyle={contentContainerStyle}
      data={categories}
      keyExtractor={(item) => item._id}
      renderItem={renderCategory}
      showsHorizontalScrollIndicator={false}
      onScrollToIndexFailed={(info) => {
        setTimeout(() => {
          flatListRef?.current?.scrollToIndex?.({
            index: info.index,
            animated: true,
            viewPosition: 0.3,
          });
        }, 100);
      }}
    />
  );
};

export default memo(CategorySelector);
