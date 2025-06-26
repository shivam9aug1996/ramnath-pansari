import React, { memo } from "react";
import { FlatList, Platform } from "react-native";
import SubCategoryItem from "./SubCategoryItem";
import { SubCategorySelectorProps } from "@/types/global";

const SubCategorySelector = ({
  subCategories,
  selectedSubCategory,
  onSelectSubCategory,
  subCatFlatListRef,
  contentContainerStyle,
}: SubCategorySelectorProps) => {
  const renderItem = ({ item }: { item: any }) => {
    const isSelected = item._id === selectedSubCategory?._id;
    return (
      <SubCategoryItem
        item={item}
        isSelected={isSelected}
        onPress={onSelectSubCategory}
      />
    );
  };

  return (
    <FlatList
      horizontal
      bounces={Platform.OS !== "android"}
      contentContainerStyle={contentContainerStyle}
      ref={subCatFlatListRef}
      onScrollToIndexFailed={()=>{
        console.error("onScrollToIndexFailed")
      }}
      data={subCategories}
      keyExtractor={(item) => item._id}
      renderItem={renderItem}
      showsHorizontalScrollIndicator={false}
    />
  );
};

export default memo(SubCategorySelector);
