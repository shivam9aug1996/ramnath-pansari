import React, {
  lazy,
  memo,
  Suspense,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { ActivityIndicator, Button, Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  productApi,
  setResetPagination,
  useFetchProductsQuery,
} from "@/redux/features/productSlice";
import { RootState } from "@/types/global";
import { scrollToTop } from "./utils";
import TryAgain from "../CategoryList/TryAgain";
import ProductsPlaceholder from "./ProductListPlaceholder";
import ProductList3 from "./ProductList3";
import CustomSuspense from "@/components/CustomSuspense";
import { Colors } from "@/constants/Colors";
// const ProductList3 = lazy(() => import("./ProductList3"));

const Products = ({ isCategoryFetching }: { isCategoryFetching: boolean }) => {
  const selectedSubCategory = useSelector(
    (state: RootState) => state.product.selectedSubCategoryId
  );
  const resetPagination = useSelector(
    (state: RootState) => state.product?.resetPagination
  );
  const [isPending, startTransition] = useTransition();
  const [load, setLoad] = useState(false);
  const dispatch = useDispatch();

  const [paginationState, setPaginationState] = useState({
    categoryId: selectedSubCategory?._id || null,
    page: 1,
    reset: false,
  });
  const flatListRef = useRef();
  const {
    data,
    isFetching: isProductsFetching,
    isError: isProductError,
    isLoading: isProductsLoading,
    isSuccess: isProductsSuccess,
    refetch,
  } = useFetchProductsQuery(
    {
      categoryId: paginationState.categoryId,
      page: paginationState.page,
      limit: 10,
      reset: paginationState.reset,
    },
    {
      skip: !paginationState.categoryId,
    }
  );

  useEffect(() => {
    if (selectedSubCategory) {
      startTransition(() => {
        scrollToTop(flatListRef);
        setPaginationState({
          ...paginationState,
          categoryId: selectedSubCategory?._id,
          page: 1,
        });
      });

      console.log("iuytredsdfghjkl");
    }
  }, [selectedSubCategory]);

  // useEffect(() => {
  //   if (load) {
  //     setPaginationState({
  //       ...paginationState,
  //       categoryId: selectedSubCategory?._id,
  //       page: 1,
  //     });
  //     setTimeout(() => {
  //       dispatch(productApi.util.resetApiState());
  //     }, 100);
  //     // dispatch(
  //     //   productApi.util.invalidateTags([
  //     //     { type: "Products", id: paginationState.categoryId },
  //     //   ])
  //     // );
  //     setLoad(false);
  //   }
  // }, [load]);

  useEffect(() => {
    if (resetPagination) {
      setPaginationState({
        ...paginationState,
        categoryId: selectedSubCategory?._id,
        page: 1,
      });
      setTimeout(() => {
        dispatch(productApi.util.resetApiState());
      }, 500);
      dispatch(setResetPagination(false));
    }
  }, [resetPagination]);

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
      isProductsLoading ? (
        // ||
        // (isProductsFetching && paginationState.page == 1)
        <ProductsPlaceholder />
      ) : (
        <CustomSuspense fallback={<ProductsPlaceholder />}>
          {isProductsFetching && paginationState.page == 1 && (
            <View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                justifyContent: "center",
                alignItems: "center",
                zIndex: 10,
              }}
            >
              <ActivityIndicator size="large" color={Colors.light.lightGreen} />
            </View>
          )}

          {isPending ? (
            <View />
          ) : (
            <ProductList3
              flatListRef={flatListRef}
              data={data}
              setPaginationState={setPaginationState}
              isProductsFetching={isProductsFetching}
              isProductsLoading={isProductsLoading}
              paginationState={paginationState}
            />
          )}
        </CustomSuspense>
      )}
    </View>
  );
};

export default memo(Products);
