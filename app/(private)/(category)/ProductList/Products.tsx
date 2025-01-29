import React, {
  lazy,
  memo,
  Suspense,
  useCallback,
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
  useLazyFetchProductsQuery,
} from "@/redux/features/productSlice";
import { RootState } from "@/types/global";
import { scrollToTop } from "./utils";
import TryAgain from "../CategoryList/TryAgain";
import ProductsPlaceholder from "./ProductListPlaceholder";
import ProductList3 from "./ProductList3";
import CustomSuspense from "@/components/CustomSuspense";
import { Colors } from "@/constants/Colors";
import { useFocusEffect, usePathname } from "expo-router";
// const ProductList3 = lazy(() => import("./ProductList3"));

const Products = ({
  isCategoryFetching,
  headerVisible,
}: {
  isCategoryFetching: boolean;
}) => {
  const pathname = usePathname();
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
      //counter: 1,
    },
    {
      skip: !paginationState.categoryId,
    }
  );

  const [fetchProducts] = useLazyFetchProductsQuery();

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
  console.log("98765redfghjk", pathname, selectedSubCategory, pathname);

  useFocusEffect(
    useCallback(() => {
      if (resetPagination?.status) {
        // refetch();
        console.log("876trdfghjk", resetPagination);
        let id = resetPagination?.item?._id;
        let index = data?.products?.findIndex((item: any) => {
          return item._id === id;
        });
        let limit = 10;
        let page = Math.ceil((index + 1) / limit);
        let mLimit = page * limit;
        console.log("index", index, page);
        fetchProducts(
          {
            categoryId: selectedSubCategory?._id,
            page: page,
            limit: 10,
            //limit: mLimit + 6,
          },
          false
        )
          ?.unwrap()
          ?.finally(() => {
            dispatch(setResetPagination({ item: null, status: false }));
          });
        // setPaginationState({
        //   ...paginationState,
        //   categoryId: selectedSubCategory?._id,
        //   page: page,
        //   reset: true,
        //   counter: paginationState.counter + 1,
        // });
        // setTimeout(() => {
        //   dispatch(productApi.util.resetApiState());
        // }, 500);
        //dispatch(setResetPagination(false));
      }
      return () => {};
    }, [resetPagination?.status, data])
  );

  // useEffect(() => {

  // }, [resetPagination?.status, data, pathname, selectedSubCategory?._id]);

  if (isProductError) {
    return <TryAgain refetch={refetch} />;
  }
  console.log("products------>", headerVisible);

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
        <ProductsPlaceholder wrapperStyle={{ paddingTop: 180 }} />
      ) : (
        <CustomSuspense
          fallback={<ProductsPlaceholder wrapperStyle={{ paddingTop: 180 }} />}
        >
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
              headerVisible={headerVisible}
            />
          )}
        </CustomSuspense>
      )}
    </View>
  );
};

export default memo(Products);
