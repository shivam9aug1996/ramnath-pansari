import { StyleSheet, Text, View } from "react-native";
import React, { lazy, memo, Suspense, useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useFetchCategoriesQuery } from "@/redux/features/categorySlice";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import CustomSuspense from "@/components/CustomSuspense";
import CategorySelectorPlaceholder from "@/app/(private)/(category)/CategoryList/CategorySelectorPlaceholder";
import SubCategorySelectorPlaceholder from "@/app/(private)/(category)/CategoryList/SubCategorySelectorPlaceholder";
// import TryAgain from "./CategoryList/TryAgain";
// import CategoryList from "./CategoryList/CategoryList";
// import Products from "./ProductList/Products";
// import GoToCart from "./ProductList/GoToCart";
const Products = lazy(
  () => import("@/app/(private)/(category)/ProductList/Products")
);
const CategoryList = lazy(
  () => import("@/app/(private)/(category)/CategoryList/CategoryList")
);

const TryAgain = lazy(
  () => import("@/app/(private)/(category)/CategoryList/TryAgain")
);
const GoToCart = lazy(
  () => import("@/app/(private)/(category)/ProductList/GoToCart")
);

const CatPro = ({ id, name, selectedCategoryIdIndex }) => {
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
  const [count, setCount] = useState(0);

  useFocusEffect(
    // Callback should be wrapped in `React.useCallback` to avoid running the effect too often.
    useCallback(() => {
      setCount((prev) => prev + 1);
      // Invoked whenever the route is focused.

      // Return function is invoked whenever the route gets out of focus.
      return () => {
       // console.log("This route is now unfocused.");
      };
    }, [])
  );

 // console.log("uytfghjhgfghj", id, name, selectedCategoryIdIndex, count);

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

export default memo(CatPro);

const styles = StyleSheet.create({});
