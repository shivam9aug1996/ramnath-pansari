import React, { memo, useCallback } from "react";
import { FlatList, Platform, ListRenderItemInfo } from "react-native";
import { devError } from "@/utils/devLog";
import SubCategoryItem from "./SubCategoryItem";
import { SubCategory, SubCategorySelectorProps } from "@/types/global";

// Average width of a subcategory chip (e.g. padding + text length)
const ESTIMATED_ITEM_WIDTH = 80;

const SubCategorySelector = ({
  subCategories = [],
  selectedSubCategory,
  onSelectSubCategory,
  subCatFlatListRef,
  contentContainerStyle,
}: SubCategorySelectorProps) => {
  const keyExtractor = useCallback((item: SubCategory) => item._id, []);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<SubCategory>) => {
      const isSelected = item._id === selectedSubCategory?._id;
      return (
        <SubCategoryItem
          item={item}
          isSelected={isSelected}
          onPress={onSelectSubCategory}
        />
      );
    },
    [selectedSubCategory?._id, onSelectSubCategory],
  );

  /**
   * Fallback strategy when scrollToIndex is called before layout measurement
   */
  const handleScrollToIndexFailed = useCallback(
    (info: {
      index: number;
      highestMeasuredFrameIndex: number;
      averageItemLength: number;
    }) => {
      devError("onScrollToIndexFailed in SubCategorySelector", info);

      const ref = subCatFlatListRef?.current;
      if (!ref || !subCategories.length) return;

      // Calculate approximate offset if averageItemLength is 0
      const itemWidth = info.averageItemLength || ESTIMATED_ITEM_WIDTH;
      const offset = Math.max(0, info.index * itemWidth - 30);

      // 1. First scroll to estimated offset so items render into view
      ref.scrollToOffset?.({ offset, animated: true });

      // 2. Retry exact scrollToIndex once the target frame has rendered
      setTimeout(() => {
        if (ref && info.index < subCategories.length) {
          ref.scrollToIndex?.({
            index: info.index,
            animated: true,
            viewPosition: 0.3,
          });
        }
      }, 120);
    },
    [subCategories.length, subCatFlatListRef],
  );

  return (
    <FlatList
      ref={subCatFlatListRef}
      horizontal
      bounces={Platform.OS !== "android"}
      contentContainerStyle={contentContainerStyle}
      data={subCategories}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      showsHorizontalScrollIndicator={false}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      onScrollToIndexFailed={handleScrollToIndexFailed}
    />
  );
};

export default memo(SubCategorySelector);