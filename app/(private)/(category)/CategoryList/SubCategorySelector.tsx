import React, { memo, useRef } from "react";
import { FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { SubCategory, SubCategorySelectorProps } from "@/types/global";

const SubCategorySelector = ({
  subCategories,
  selectedSubCategory,
  onSelectSubCategory,
  subCatFlatListRef,
}: SubCategorySelectorProps) => {
  console.log("sub category selector----->");
  const renderSubCategory = ({
    item,
  }: {
    item: SubCategory;
    index: number;
  }) => (
    <TouchableOpacity
      style={[
        styles.subCategoryContainer,
        {
          backgroundColor:
            item._id === selectedSubCategory?._id
              ? Colors.light.mediumGreen
              : Colors.light.lightGrey,
        },
      ]}
      onPress={() => onSelectSubCategory(item)}
    >
      <ThemedText
        style={[
          styles.subCategoryText,
          {
            color:
              item._id === selectedSubCategory?._id
                ? Colors.light.white
                : Colors.light.darkGrey,
          },
        ]}
      >
        {item.name}
      </ThemedText>
    </TouchableOpacity>
  );

  return (
    <FlatList
      ref={subCatFlatListRef}
      data={subCategories}
      horizontal
      keyExtractor={(item) => item._id}
      showsHorizontalScrollIndicator={false}
      renderItem={renderSubCategory}
    />
  );
};

const styles = StyleSheet.create({
  loaderStyle: {
    marginRight: 10,
    marginBottom: 10,
    marginTop: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  subCategoryContainer: {
    marginRight: 10,
    marginBottom: 10,
    marginTop: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  subCategoryText: {
    fontSize: 14,
  },
});

export default memo(SubCategorySelector);