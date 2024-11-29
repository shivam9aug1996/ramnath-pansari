import { StyleSheet, Text } from "react-native";
import React, { lazy, Suspense } from "react";
import { useLocalSearchParams } from "expo-router";
import { useFetchCategoriesQuery } from "@/redux/features/categorySlice";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";

import TryAgain from "./CategoryList/TryAgain";
// import Products from "./ProductList/Products";
import CategoryList from "./CategoryList/CategoryList";
import GoToCart from "./ProductList/GoToCart";
import useLazyComponent from "@/hooks/useLazyComponent";
const Products = React.lazy(() => import("./ProductList/Products"));

// const Products = lazy(() => import("./ProductList/Products"));
// const CategoryList = lazy(() => import("./CategoryList/CategoryList"));

const product = () => {
  const { id, name, selectedCategoryIdIndex } = useLocalSearchParams<{
    id: string;
    name?: string;
  }>();
  // const [VeryExpensive, needsExpensive] = useLazyComponent(
  //   require("./ProductList/Products").default
  // );

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

            <Suspense fallback={<Text>hi</Text>}>
              <Products isCategoryFetching={isCategoryFetching} />
            </Suspense>

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
