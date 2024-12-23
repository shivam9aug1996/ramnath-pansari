import React, {
  lazy,
  memo,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
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
// const CategorySelector = lazy(() => import("./CategorySelector"));
// const SubCategorySelector = lazy(() => import("./SubCategorySelector"));
const CategoryList = ({
  categories,
  isCategoryFetching,
  selectedCategoryIdIndex,
}: CategoryListProps) => {
  const subCatTimerRef = useRef<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );

  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] =
    useState<SubCategory | null>(null);
  const subCatFlatListRef = useRef(null);

  const dispatch = useDispatch();

  useEffect(() => {
    return () => {
      // clearTimeout(subCatTimerRef.current);
    };
  });
  for (let i = 0; i < 10000; i++) {}
  useEffect(() => {
    if (categories?.length > 0) {
      setSelectedCategory(categories[0]);
    }
  }, [categories]);

  useEffect(() => {
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
      //clearTimeout(subCatTimerRef.current);
      //  subCatTimerRef.current = setTimeout(() => {
      const selectedId =
        selectedSubCategory?._id === "all"
          ? selectedCategory
          : selectedSubCategory;
      dispatch(setSelectedSubCategoryId(selectedId));
      //  }, 100);
    }
  }, [selectedSubCategory]);

  return (
    <View>
      {isCategoryFetching ? (
        <CategorySelectorPlaceholder />
      ) : (
        <CustomSuspense fallback={<CategorySelectorPlaceholder />}>
          <CategorySelector
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </CustomSuspense>
      )}
      {isCategoryFetching ? (
        <SubCategorySelectorPlaceholder />
      ) : (
        <CustomSuspense fallback={<SubCategorySelectorPlaceholder />}>
          <SubCategorySelector
            subCategories={subCategories}
            selectedSubCategory={selectedSubCategory}
            onSelectSubCategory={setSelectedSubCategory}
            subCatFlatListRef={subCatFlatListRef}
          />
        </CustomSuspense>
      )}
    </View>
  );
};

export default memo(CategoryList);
