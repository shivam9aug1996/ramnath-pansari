import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { useDispatch } from "react-redux";

import { setSelectedSubCategoryId } from "@/redux/features/productSlice";
import { setSubCategoryActionClicked } from "@/redux/features/categorySlice";
import { addCategoryView } from "@/redux/features/recentlyViewedSlice";

import CategorySelector from "./CategorySelector";
import SubCategorySelector from "./SubCategorySelector";
import CategorySelectorPlaceholder from "./CategorySelectorPlaceholder";
import SubCategorySelectorPlaceholder from "./SubCategorySelectorPlaceholder";

import { Category, CategoryListProps, SubCategory } from "@/types/global";
import { scrollToIndex, scrollToTop } from "../ProductList/utils";
import { getSubCategoryIndex } from "./utils";
import AppHead from "@/components/AppHead";
import { devLog } from "@/utils/devLog";

const ALL_SUBCATEGORY_OPTION: SubCategory = { _id: "all", name: "All" };

const CategoryList = ({
  categories = [],
  isCategoryFetching,
  selectedCategoryIdIndex = 0,
  contentContainerStyle,
  parentCategory,
}: CategoryListProps) => {
  const dispatch = useDispatch();

  const catFlatListRef = useRef<any>(null);
  const subCatFlatListRef = useRef<any>(null);
  const previousSelectedCategory = useRef<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | null>(null);

  // Sync active category when prop index or categories array changes
  useEffect(() => {
    if (
      selectedCategoryIdIndex !== undefined &&
      categories?.length > 0 &&
      selectedCategoryIdIndex >= 0 &&
      selectedCategoryIdIndex < categories.length
    ) {
      const activeCategory = categories[selectedCategoryIdIndex];
      setSelectedCategory(activeCategory);

      requestAnimationFrame(() => {
        scrollToIndex(catFlatListRef, selectedCategoryIdIndex, 0.3);
      });
    }
  }, [selectedCategoryIdIndex, categories]);

  // Compute subcategories whenever selectedCategory changes
  const subCategories = useMemo(() => {
    if (!selectedCategory) return [];
    return [ALL_SUBCATEGORY_OPTION, ...(selectedCategory.children || [])];
  }, [selectedCategory]);

  // Handle category view tracking and subcategory state resets
  useEffect(() => {
    if (!selectedCategory) return;

    setSelectedSubCategory(subCategories[0] || null);
    scrollToTop(subCatFlatListRef);

    if (parentCategory && selectedCategory) {
      dispatch(
        addCategoryView({
          id: selectedCategory._id,
          name: selectedCategory.name,
          parentCategoryId: parentCategory._id,
          parentCategoryName: parentCategory.name,
          selectedCategoryIdIndex,
        }),
      );
    }
  }, [selectedCategory, subCategories, parentCategory, selectedCategoryIdIndex, dispatch]);

  // Dispatch selected subcategory changes to Redux product state
  useEffect(() => {
    if (!selectedSubCategory || isCategoryFetching) return;

    const subCategoryIndex = getSubCategoryIndex(
      subCategories,
      selectedSubCategory,
    );
    scrollToIndex(subCatFlatListRef, subCategoryIndex);

    const selectedId =
      selectedSubCategory._id === "all"
        ? selectedCategory
        : selectedSubCategory;

    if (previousSelectedCategory.current === selectedId?._id) {
      dispatch(setSubCategoryActionClicked(false));
    }
    previousSelectedCategory.current = selectedId?._id ?? null;

    devLog("[products] setSelectedSubCategoryId", {
      selectedId: selectedId?._id,
      selectedName: selectedId?.name,
      fromAll: selectedSubCategory._id === "all",
      selectedCategoryIdIndex,
      parentCategoryId: parentCategory?._id,
    });

    dispatch(setSelectedSubCategoryId(selectedId));
  }, [
    selectedSubCategory,
    subCategories,
    selectedCategory,
    isCategoryFetching,
    selectedCategoryIdIndex,
    parentCategory?._id,
    dispatch,
  ]);

  const handleSelectCategory = useCallback(
    (category: Category) => {
      const index = categories.findIndex((c) => c._id === category._id);
      setSelectedCategory(category);

      if (index >= 0) {
        scrollToIndex(catFlatListRef, index, 0.3);
      }
    },
    [categories],
  );

  return (
    <View>
      <AppHead title={selectedCategory?.name} />

      {isCategoryFetching ? (
        <CategorySelectorPlaceholder
          contentContainerStyle={{ paddingHorizontal: 30 }}
        />
      ) : (
        <CategorySelector
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          contentContainerStyle={contentContainerStyle}
          flatListRef={catFlatListRef}
        />
      )}

      {isCategoryFetching ? (
        <SubCategorySelectorPlaceholder
          contentContainerStyle={{ paddingHorizontal: 30 }}
        />
      ) : (
        <SubCategorySelector
          subCategories={subCategories}
          selectedSubCategory={selectedSubCategory}
          onSelectSubCategory={setSelectedSubCategory}
          subCatFlatListRef={subCatFlatListRef}
          contentContainerStyle={contentContainerStyle}
        />
      )}
    </View>
  );
};

export default memo(CategoryList);