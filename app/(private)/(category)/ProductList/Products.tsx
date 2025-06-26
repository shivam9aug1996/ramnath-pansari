import React, {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { ActivityIndicator, View, FlatList } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  setResetPagination,
  setSelectedCategoryClicked,
  useFetchProductsQuery,
  useLazyFetchProductsQuery,
} from "@/redux/features/productSlice";
import { RootState, Product } from "@/types/global";
import { scrollToTop } from "./utils";
import TryAgain from "../CategoryList/TryAgain";
import ProductsPlaceholder from "./ProductListPlaceholder";
import ProductList3 from "./ProductList3";
import CustomSuspense from "@/components/CustomSuspense";
import { Colors } from "@/constants/Colors";
import { useFocusEffect, usePathname } from "expo-router";
import { debounce } from "lodash";
import { Text } from "react-native";
import { setSubCategoryActionClicked } from "@/redux/features/categorySlice";

interface ProductsProps {
  isCategoryFetching: boolean;
}

interface PaginationState {
  categoryId: string | null;
  page: number;
  reset: boolean;
}

interface ProductList3Props {
  flatListRef: React.RefObject<FlatList>;
  data: {
    products: Product[];
    currentPage: number;
    totalPages: number;
    totalResults: number;
  };
  setPaginationState: (
    updater: (prev: PaginationState) => PaginationState
  ) => void;
  isProductsFetching: boolean;
  isProductsLoading: boolean;
  paginationState: PaginationState;
  headerVisible: boolean;
}

const Products = ({ isCategoryFetching }: ProductsProps) => {
  const subCategoryActionClicked = useSelector(
    (state: RootState) => state.category.subCategoryActionClicked
  );
  const selectedSubCategory = useSelector(
    (state: RootState) => state.product.selectedSubCategoryId
  );
  const selectedCategoryClicked = useSelector(
    (state: RootState) => state.product.selectedCategoryClicked
  );
  const resetPagination = useSelector(
    (state: RootState) => state.product?.resetPagination
  );
  const dispatch = useDispatch();

  const [paginationState, setPaginationState] = useState<PaginationState>({
    categoryId: selectedSubCategory?._id || null,
    page: 1,
    reset: false,
  });

  const flatListRef = useRef<FlatList>(null);

  const {
    data,
    isFetching: isProductsFetching,
    isError: isProductError,
    isLoading: isProductsLoading,
    refetch,
  } = useFetchProductsQuery(
    {
      categoryId: paginationState.categoryId,
      page: paginationState.page,
      limit: 10,
      reset: paginationState.reset,
    },
    {
      skip: !paginationState.categoryId || paginationState.page < 1 ,
    }
  );

  const [fetchProducts] = useLazyFetchProductsQuery();

  // // Handle category change
  // useEffect(() => {
  //   if (selectedSubCategory) {
  //     startTransition(() => {
  //       scrollToTop(flatListRef);
  //       setPaginationState((prev) => ({
  //         ...prev,
  //         categoryId: selectedSubCategory._id,
  //         page: 1,
  //       }));
  //     });
  //   }
  // }, [selectedSubCategory]);

  // ✅ Debounced & rAF category change handler (No flicker, smooth)
  useEffect(() => {
    // const handleCategoryChange = debounce(() => {
    //   requestAnimationFrame(() => {
    //     if (selectedSubCategory) {
    //       scrollToTop(flatListRef);
    //       setPaginationState((prev) => ({
    //         ...prev,
    //         categoryId: selectedSubCategory._id,
    //         page: 1,
    //       }));
    //     }
    //   });
    // }, 0); // 200ms debounce

    // handleCategoryChange();

    // return () => {
    //   handleCategoryChange.cancel();
    // };
    requestAnimationFrame(() => {
      if (selectedSubCategory) {
        scrollToTop(flatListRef);
        setPaginationState((prev) => ({
          ...prev,
          categoryId: selectedSubCategory._id,
          page: 1,
        }));
        dispatch(setSubCategoryActionClicked(false));
      }
    });
  }, [selectedSubCategory]);

  // useEffect(()=>{
  //   if(isProductError){
  //     dispatch(setSelectedCategoryClicked(false));
  //   }
  //   console.log("data567890---->",data);
  //   if(data?.products?.length>0||data?.products?.length===0){
  //     dispatch(setSelectedCategoryClicked(false));
  //   }
  // },[isProductError,data])

  // Handle pagination reset
  useFocusEffect(
    useCallback(() => {
      requestAnimationFrame(() => {
        if (resetPagination?.status && data?.products) {
          const id = resetPagination?.item?._id;
          const index = data.products.findIndex(
            (item: Product) => item._id === id
          );
          const page = Math.ceil((index + 1) / 10);

          fetchProducts(
            {
              categoryId: selectedSubCategory?._id,
              page,
              limit: 10,
            },
            false
          )
            ?.unwrap()
            ?.finally(() => {
              dispatch(setResetPagination({ item: null, status: false }));
            });
        }
      });
    }, [resetPagination?.status, data, selectedSubCategory?._id, dispatch])
  );

  if (isProductError) {
    return <TryAgain refetch={refetch} />;
  }

  const isLoading =
    isCategoryFetching || !paginationState.categoryId || isProductsLoading;
  // if(subCategoryActionClicked){
  //   return <ActivityIndicator size="large" color={Colors.light.lightGreen} />
  // }

  return (
    <View style={{ flex: 1 }}>
      {isLoading ? (
        <ProductsPlaceholder wrapperStyle={{ paddingTop: 180 }} />
      ) : (
        <>
          {isProductsFetching && paginationState.page === 1 && (
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
          {subCategoryActionClicked && (
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
          {/* {(paginationState.page === 1 && isProductsFetching) ||
          subCategoryActionClicked ? (
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
              <ActivityIndicator size="large" color={Colors.light.lightRed} />
            </View>
          ) : ( */}
            <ProductList3
              flatListRef={flatListRef}
              data={data}
              setPaginationState={setPaginationState}
              isProductsFetching={
                isProductsFetching ||
                selectedCategoryClicked ||
                subCategoryActionClicked
              }
              isProductsLoading={isProductsLoading}
              paginationState={paginationState}
            />
          {/* )} */}
        </>
      )}
    </View>
  );
};

export default memo(Products);
