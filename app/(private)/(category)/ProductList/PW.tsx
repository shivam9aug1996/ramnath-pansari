import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { useSelector } from "react-redux";
import { useFetchProductsQuery } from "@/redux/features/productSlice";
import ProductList from "./ProductList";
import Pagination from "./Pagination";
import { RootState } from "@/types/global";
import { scrollToTop } from "./utils";
import TryAgain from "../CategoryList/TryAgain";
import ProductsPlaceholder from "./ProductListPlaceholder";
import DelayedVisibilityWrapper from "@/components/DelayedVisibilityWrapper";
import ProductListPlaceholder from "./ProductListPlaceholder";
import PaginationPlaceholder from "./PaginationPlaceholder";
import ProductList2 from "./ProductList2";

const Products = ({ isCategoryFetching }: { isCategoryFetching: boolean }) => {
  const selectedSubCategory = useSelector(
    (state: RootState) => state.product.selectedSubCategoryId
  );

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
    isUninitialized,
    isLoading,
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
    if (!isProductsFetching || !isCategoryFetching) {
      scrollToTop(flatListRef);
    }
  }, [isProductsFetching, isCategoryFetching]);

  useEffect(() => {
    if (selectedSubCategory) {
      scrollToTop(flatListRef);
      setPaginationState({
        categoryId: selectedSubCategory?._id,
        page: 1,
      });
    }
  }, [selectedSubCategory]);

  const loadNextPage = useCallback(() => {
    if (paginationState.page < data?.totalPages) {
      scrollToTop(flatListRef);
      setPaginationState((prevState) => ({
        ...prevState,
        page: prevState.page + 1,
      }));
    }
  }, [paginationState.page, data?.totalPages]);

  const loadPreviousPage = useCallback(() => {
    if (paginationState.page > 1) {
      scrollToTop(flatListRef);
      setPaginationState((prevState) => ({
        ...prevState,
        page: prevState.page - 1,
      }));
    }
  }, [paginationState.page]);

  if (isProductError) {
    return <TryAgain refetch={refetch} />;
  }
  console.log("products------>");

  return (
    <View style={{ flex: 1 }}>
      {isCategoryFetching ||
      !paginationState.categoryId ||
      isProductsFetching ? (
        <ProductsPlaceholder />
      ) : (
        <DelayedVisibilityWrapper
          delay={100}
          fallback={<ProductListPlaceholder />}
        >
          {/* <ProductList flatListRef={flatListRef} data={data?.products} /> */}
          <ProductList2
            flatListRef={flatListRef}
            data={data}
            isFetching={isProductsFetching}
            setPaginationState={setPaginationState}
          />
        </DelayedVisibilityWrapper>
      )}

      {/* {data?.totalPages > 0 || isProductsFetching || isCategoryFetching ? (
        <Pagination
          page={paginationState.page}
          totalPages={data?.totalPages}
          isFetching={isProductsFetching || isCategoryFetching}
          onNext={loadNextPage}
          onPrevious={loadPreviousPage}
        />
      ) : null} */}
    </View>
  );
};

export default memo(Products);
