import { StyleSheet, Text } from "react-native";
import React, { lazy, Suspense } from "react";
import { useLocalSearchParams } from "expo-router";
import { useFetchCategoriesQuery } from "@/redux/features/categorySlice";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";

import TryAgain from "./CategoryList/TryAgain";
import Products from "./ProductList/Products";
import CategoryList from "./CategoryList/CategoryList";
import GoToCart from "./ProductList/GoToCart";

// const Products = lazy(() => import("./ProductList/Products"));
// const CategoryList = lazy(() => import("./CategoryList/CategoryList"));

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

  return (
    <>
      <ScreenSafeWrapper showCartIcon={true} title={name} showSearchIcon={true}>
        {isCategoryFetchingError ? (
          <TryAgain refetch={refetch} />
        ) : (
          <>
            {/* <Suspense> */}
            <CategoryList
              categories={getCategories?.children}
              isCategoryFetching={isCategoryFetching}
              selectedCategoryIdIndex={selectedCategoryIdIndex}
            />
            {/* </Suspense> */}

            {/* <Suspense> */}
            <Products isCategoryFetching={isCategoryFetching} />

            {/* </Suspense> */}
          </>
        )}
      </ScreenSafeWrapper>
      <GoToCart />
    </>
  );
};

export default product;

const styles = StyleSheet.create({});
