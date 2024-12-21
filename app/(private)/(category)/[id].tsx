import { StyleSheet, Text, View } from "react-native";
import React, { lazy, Suspense } from "react";
import { useLocalSearchParams } from "expo-router";
import { useFetchCategoriesQuery } from "@/redux/features/categorySlice";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import CustomSuspense from "@/components/CustomSuspense";
import CategorySelectorPlaceholder from "./CategoryList/CategorySelectorPlaceholder";
import SubCategorySelectorPlaceholder from "./CategoryList/SubCategorySelectorPlaceholder";
// import TryAgain from "./CategoryList/TryAgain";
// import CategoryList from "./CategoryList/CategoryList";
// import Products from "./ProductList/Products";
// import GoToCart from "./ProductList/GoToCart";
const Products = lazy(() => import("./ProductList/Products"));
const CategoryList = lazy(() => import("./CategoryList/CategoryList"));

const TryAgain = lazy(() => import("./CategoryList/TryAgain"));
const GoToCart = lazy(() => import("./ProductList/GoToCart"));

const product = () => {
  const { id, name, selectedCategoryIdIndex } = useLocalSearchParams<{
    id: string;
    name?: string;
  }>();

  const {
    data: getCategories,
    isFetching: isCategoryFetching,
    isError: isCategoryFetchingError,
    refetch,
  } = useFetchCategoriesQuery(
    {
      categoryId: id,
    },
    { skip: !id }
  );

  console.log("uytfghjhgfghj", isCategoryFetching);

  return (
    <>
      <ScreenSafeWrapper showCartIcon={true} title={name} showSearchIcon={true}>
        <CustomSuspense>
          {isCategoryFetchingError ? (
            <Suspense fallback={null}>
              <TryAgain refetch={refetch} />
            </Suspense>
          ) : (
            <>
              <Suspense fallback={null}>
                <CategoryList
                  categories={getCategories?.children}
                  isCategoryFetching={isCategoryFetching}
                  selectedCategoryIdIndex={selectedCategoryIdIndex}
                />
              </Suspense>

              <CustomSuspense>
                <Suspense fallback={null}>
                  <Products isCategoryFetching={isCategoryFetching} />
                </Suspense>
              </CustomSuspense>
            </>
          )}
        </CustomSuspense>
      </ScreenSafeWrapper>
      <CustomSuspense>
        <Suspense fallback={null}>
          <GoToCart />
        </Suspense>
      </CustomSuspense>
    </>
  );
};

export default product;

const styles = StyleSheet.create({});
