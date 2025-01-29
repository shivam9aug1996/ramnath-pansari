import React, { memo, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { useDispatch } from "react-redux";
import { setSelectedSubCategoryId } from "@/redux/features/productSlice";
import CategorySelector from "./CategorySelector";
import SubCategorySelector from "./SubCategorySelector";
import { Category, CategoryListProps, SubCategory } from "@/types/global";
import SubCategorySelectorPlaceholder from "./SubCategorySelectorPlaceholder";
import CategorySelectorPlaceholder from "./CategorySelectorPlaceholder";
import { scrollToIndex, scrollToTop } from "../ProductList/utils";
import { getSubCategoryIndex } from "./utils";
import CustomSuspense from "@/components/CustomSuspense";

const CategoryList = ({
  categories,
  isCategoryFetching,
  selectedCategoryIdIndex,
  contentContainerStyle,
}: CategoryListProps) => {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );

  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] =
    useState<SubCategory | null>(null);
  const subCatFlatListRef = useRef(null);

  const dispatch = useDispatch();
  console.log("category list---->");

  // useEffect(() => {
  //   if (categories?.length > 0) {
  //     setSelectedCategory(categories[0]);
  //   }
  // }, [categories]);

  useEffect(() => {
    if (categories?.length > 0) {
      setSelectedCategory(categories[0]);
    }
    if (selectedCategoryIdIndex && categories) {
      setSelectedCategory(categories[selectedCategoryIdIndex]);
    }
  }, [selectedCategoryIdIndex, categories]);

  useEffect(() => {
    if (selectedCategory) {
      const updatedSubCategories = [
        { _id: "all", name: "All" },
        ...(selectedCategory.children || []),
      ];
      setSubCategories(updatedSubCategories);
      setSelectedSubCategory(updatedSubCategories[0]);
      scrollToTop(subCatFlatListRef);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedSubCategory && !isCategoryFetching) {
      const subCategoryIndex = getSubCategoryIndex(
        subCategories,
        selectedSubCategory
      );
      scrollToIndex(subCatFlatListRef, subCategoryIndex);
      const selectedId =
        selectedSubCategory?._id === "all"
          ? selectedCategory
          : selectedSubCategory;
      dispatch(setSelectedSubCategoryId(selectedId));
    }
  }, [selectedSubCategory]);
  console.log("hio");
  return (
    <View>
      {isCategoryFetching ? (
        <CategorySelectorPlaceholder
          contentContainerStyle={{ paddingHorizontal: 30 }}
        />
      ) : (
        <CustomSuspense
          delay={0}
          fallback={
            <CategorySelectorPlaceholder
              contentContainerStyle={{ paddingHorizontal: 30 }}
            />
          }
        >
          <CategorySelector
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            contentContainerStyle={contentContainerStyle}
          />
        </CustomSuspense>
      )}
      {isCategoryFetching ? (
        <SubCategorySelectorPlaceholder
          contentContainerStyle={{ paddingHorizontal: 30 }}
        />
      ) : (
        <CustomSuspense
          delay={0}
          fallback={
            <SubCategorySelectorPlaceholder
              contentContainerStyle={{ paddingHorizontal: 30 }}
            />
          }
        >
          <SubCategorySelector
            subCategories={subCategories}
            selectedSubCategory={selectedSubCategory}
            onSelectSubCategory={setSelectedSubCategory}
            subCatFlatListRef={subCatFlatListRef}
            contentContainerStyle={contentContainerStyle}
          />
        </CustomSuspense>
      )}
    </View>
  );
};

export default memo(CategoryList);
