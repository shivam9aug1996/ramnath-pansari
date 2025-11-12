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
  productApi,
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CACHE_DURATION, cleanAllProductCache, cleanOldProductCache } from "@/utils/utils";

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
  console.log("selectedSubCategory765434567890--", selectedSubCategory?._id);
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
  console.log("paginationSta45678te23456789876543", selectedSubCategory);

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
      skip:
        !paginationState.categoryId ||
        paginationState.page < 1 ||
        paginationState.categoryId === "null",
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
          console.log("resetPagination23456789876543", resetPagination);
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

  // Outside JSX, inside your parent component
const handleRefetchProducts = useCallback(async () => {
  // 1️⃣ Clear product cache
  await cleanAllProductCache();
 // await refetch()?.unwrap()
  setPaginationState((prev) => ({
    ...prev,
    page: 1,
  }));
  // await dispatch(
  //   productApi.endpoints.fetchProducts.initiate(
  //     { categoryId: selectedSubCategory?._id, page: 1, limit: 10 },
  //     { forceRefetch: true }
  //   )
  // );
 dispatch(productApi.util.resetApiState())
 // dispatch(productApi.util.resetApiState())



  // 2️⃣ Clear RTK Query cached data for this query
  // dispatch(
  //   productApi.util.updateQueryData(
  //     "fetchProducts",
  //     {
  //       categoryId: selectedSubCategory?._id,
       
  //     },
  //     (draft) => {
  //       draft.products = [];
  //       draft.currentPage = 1;
  //     }
  //   )
  // );

  // 3️⃣ Reset pagination state
  // setPaginationState((prev) => ({
  //   ...prev,
  //   page: 1,
  // }));

  // 4️⃣ Fetch fresh products
  // await fetchProducts(
  //   {
  //     categoryId: selectedSubCategory?._id,
  //     page: 1,
  //     limit: 10,
  //   },
  //   false
  // )?.unwrap();
}, [dispatch, selectedSubCategory?._id, setPaginationState, fetchProducts]);


  if (isProductError) {
    return <TryAgain refetch={handleRefetchProducts} />;
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
          refetch={handleRefetchProducts}
            // refetch={async()=>{
            //   await cleanAllProductCache()
            //   dispatch(
            //     productApi.util.updateQueryData("fetchProducts", { categoryId: selectedSubCategory?._id, page: 1, limit: 10 }, (draft) => {
            //       draft.products = [];
            //     })
            //   )
            //   setPaginationState((prev) => ({
            //     ...prev,
            //     page: 1,
            //   }));

            //   await fetchProducts(
            //     {
            //       categoryId: selectedSubCategory?._id,
            //       page: 1,
            //       limit: 10,
            //     },
            //     false
            //   )?.unwrap()
            // }}
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
