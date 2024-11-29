import React, { memo, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useFetchProductsQuery } from "@/redux/features/productSlice";
import { RootState } from "@/types/global";
import { scrollToTop } from "./utils";
import TryAgain from "../CategoryList/TryAgain";
import ProductsPlaceholder from "./ProductListPlaceholder";
import ProductList3 from "./ProductList3";

const Products = ({ isCategoryFetching }: { isCategoryFetching: boolean }) => {
  const selectedSubCategory = useSelector(
    (state: RootState) => state.product.selectedSubCategoryId
  );
  const dispatch = useDispatch();

  const [paginationState, setPaginationState] = useState({
    categoryId: selectedSubCategory?._id || null,
    page: 1,
  });
  const flatListRef = useRef();
  const {
    data,
    isFetching: isProductsFetching,
    isError: isProductError,
    refetch,
  } = useFetchProductsQuery(
    {
      categoryId: paginationState.categoryId,
      page: paginationState.page,
      limit: 10,
    },
    {
      skip: !paginationState.categoryId,
    }
  );

  useEffect(() => {
    if (selectedSubCategory) {
      scrollToTop(flatListRef);
      setPaginationState({
        categoryId: selectedSubCategory?._id,
        page: 1,
      });
    }
  }, [selectedSubCategory]);

  if (isProductError) {
    return <TryAgain refetch={refetch} />;
  }
  console.log("products------>");

  return (
    <View
      style={{
        flex: 1,
      }}
    >
      {isCategoryFetching ||
      !paginationState.categoryId ||
      (isProductsFetching && paginationState.page == 1) ? (
        <ProductsPlaceholder />
      ) : (
        <ProductList3
          flatListRef={flatListRef}
          data={data}
          setPaginationState={setPaginationState}
          isProductsFetching={isProductsFetching}
        />
      )}
    </View>
  );
};

export default memo(Products);
