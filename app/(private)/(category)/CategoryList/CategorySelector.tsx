import React, { memo, useCallback } from "react";
import { FlatList, Platform, ListRenderItemInfo } from "react-native";
import CategoryItem from "./CategoryItem";
import { Category, CategorySelectorProps } from "@/types/global";

// Estimated width for a category item container (including right margin)
const ESTIMATED_ITEM_WIDTH = 88;

const CategorySelector = ({
  categories = [],
  selectedCategory,
  onSelectCategory,
  contentContainerStyle,
  variant = "small",
  flatListRef,
}: CategorySelectorProps) => {
  const keyExtractor = useCallback((item: Category) => item._id, []);

  const renderCategory = useCallback(
    ({ item, index }: ListRenderItemInfo<Category>) => {
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
    },
    [selectedCategory?._id, onSelectCategory, variant],
  );

  const handleScrollToIndexFailed = useCallback(
    (info: {
      index: number;
      highestMeasuredFrameIndex: number;
      averageItemLength: number;
    }) => {
      const ref = flatListRef?.current;
      if (!ref || !categories.length) return;

      // 1. Calculate approximate pixel offset if averageItemLength is 0
      const itemWidth = info.averageItemLength || ESTIMATED_ITEM_WIDTH;
      const offset = Math.max(0, info.index * itemWidth - 20);

      // 2. Scroll to estimated offset to force the item to mount into view
      ref.scrollToOffset?.({ offset, animated: true });

      // 3. Retry exact scrollToIndex once frame layout is measured
      setTimeout(() => {
        if (ref && info.index < categories.length) {
          ref.scrollToIndex?.({
            index: info.index,
            animated: true,
            viewPosition: 0.3,
          });
        }
      }, 120);
    },
    [categories.length, flatListRef],
  );

  return (
    <FlatList
      ref={flatListRef}
      nestedScrollEnabled={true}
      horizontal
      bounces={Platform.OS !== "android"}
      contentContainerStyle={contentContainerStyle}
      data={categories}
      keyExtractor={keyExtractor}
      renderItem={renderCategory}
      showsHorizontalScrollIndicator={false}
      initialNumToRender={8}
      onScrollToIndexFailed={handleScrollToIndexFailed}
    />
  );
};

export default memo(CategorySelector);