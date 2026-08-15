import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Platform,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import {
  setCurrentSearchQuery,
  useFetchProductsBySearchQuery,
  useLazyFetchProductsBySearchQuery,
} from "@/redux/features/searchSlice";
import {
  useCreateRecentSearchMutation,
  useLazyFetchRecentSearchQuery,
} from "@/redux/features/recentSearchSlice";
import {
  saveLocalRecentSearchItem,
  upsertRecentSearchInStore,
  writeRecentSearchCache,
} from "@/utils/recentSearchConfigCache";
import { useFetchCartQuery } from "@/redux/features/cartSlice";

import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import CustomTextInput from "@/components/CustomTextInput";
import ProductListPlaceholder, {
  ProductItemSkeletonStatic,
  ProductPaginationSkeleton,
} from "../(category)/ProductList/ProductListPlaceholder";
import {
  buildProductListData,
  GO_TO_CART_ESTIMATED_HEIGHT,
  isProductSkeleton,
  PRODUCT_LIST_PADDING_BOTTOM,
  ProductListRow,
} from "../(category)/ProductList/productListLayout";
import NotFound from "./NotFound";
import GoToCartWrapper from "../(category)/ProductList/GoToCartWrapper";
import { useHideOnScroll } from "@/hooks/useHideOnScroll";

import { Colors } from "@/constants/Colors";
import { ThemedText } from "@/components/ThemedText";
import { RootState, CartItem } from "@/types/global";
import {
  setProductListScrollParams,
  setResetPagination,
} from "@/redux/features/productSlice";
import { addSearchQuery } from "@/redux/features/recentlyViewedSlice";
import DeferredFadeIn from "@/components/DeferredFadeIn";
import ProductItemWrapper from "../(category)/ProductList/ProductItemWrapper";
import { useGoToCartListPadding } from "@/contexts/DeliveryFloatContext";
import { clearVisibleProductIds } from "../(category)/ProductList/productVisibilityStore";
import AppHead from "@/components/AppHead";
import ProductFilterFab from "@/components/productFilters/ProductFilterFab";
import LazyProductFilterSheet, {
  preloadProductFilterSheet,
} from "@/components/productFilters/LazyProductFilterSheet";
import { useProductListFilters } from "@/components/productFilters/useProductListFilters";
import { DEFAULT_PRODUCT_FILTERS } from "@/utils/productFilters";

const QueryResult = ({
  query,
  initialBrands = [],
  brandBrowse = false,
}: {
  query: string;
  initialBrands?: string[];
  /**
   * Brand landing: empty text query + brand filter.
   * Typing a new search (via search screen) leaves this mode.
   */
  brandBrowse?: boolean;
}) => {
  const scrollEndedRef = useRef(0);

  const userId = useSelector((state: RootState) => state.auth?.userData?._id);
  const isGuestUser = useSelector(
    (state: RootState) => state.auth?.userData?.isGuestUser,
  );
  const resetPagination = useSelector(
    (state: RootState) => state.product?.resetPagination
  );
  const [fetchRecentSearch] = useLazyFetchRecentSearchQuery();

  const [page, setPage] = useState(1);
  const [searchReset, setSearchReset] = useState(false);
  const pagingLockRef = useRef(false);
  const dispatch = useDispatch();
  const goToCartListPadding = useGoToCartListPadding();
  const { data: cartData } = useFetchCartQuery({ userId }, { skip: !userId });
  const [fetchProductsBySearch] = useLazyFetchProductsBySearchQuery();

  const browseBrandName = useMemo(() => {
    if (!brandBrowse) return "";
    return (initialBrands[0] || query || "").trim();
  }, [brandBrowse, initialBrands, query]);

  /** Text query while browsing a brand; normal query otherwise. */
  const apiQuery = brandBrowse ? "" : query;

  const resetSearchToPageOne = useCallback(() => {
    setPage(1);
    setSearchReset(true);
  }, []);

  const {
    applied,
    draft,
    setDraft,
    brands,
    brandsLoading,
    filterKey,
    apiParams,
    filterVisible,
    openFilters,
    closeFilters,
    applyDraft,
    clearAll,
  } = useProductListFilters({
    searchQuery: apiQuery,
    initialBrands,
    onFiltersApplied: resetSearchToPageOne,
  });

  const isBrandOnlyMode =
    brandBrowse && applied.brands.length > 0 && !apiQuery.trim();

  const handleOpenFilters = useCallback(() => {
    void preloadProductFilterSheet();
    openFilters();
  }, [openFilters]);

  const { data, isFetching, error, isSuccess, isLoading } =
    useFetchProductsBySearchQuery(
      {
        ...(apiQuery.trim() ? { query: apiQuery } : {}),
        type: "autocomplete",
        page,
        limit: 10,
        reset: searchReset,
        filterKey,
        ...apiParams,
      },
      {
        // Allow fetch with brand filter even when query is empty.
        skip: !apiQuery.trim() && applied.brands.length === 0,
      },
    );

  const hasNextPage = data?.currentPage < data?.totalPages;

// const { showSkeleton: showPaginationSkeleton, beginPaging, isPagingMore } =
//   usePaginationSkeleton({
//     isFetching,
//     page,
//     hasItems: (data?.results?.length ?? 0) > 0,
//     hasNextPage,
//     itemCount: data?.results?.length ?? 0,
//   });
  const hasResults = (data?.results?.length ?? 0) > 0;

  const showInitialSkeleton = !hasResults && (isLoading || isFetching);



  const onChromeVisibilityChange = useCallback(
    (hidden: boolean) => {
      dispatch(setProductListScrollParams({ shouldHideChrome: hidden }));
    },
    [dispatch],
  );

  const { reset: resetScrollChrome } = useHideOnScroll(
    onChromeVisibilityChange,
  );

  useFocusEffect(
    useCallback(() => {
      resetScrollChrome();
      return () => resetScrollChrome();
    }, [resetScrollChrome]),
  );

  useEffect(() => {
    setPage(1);
    setSearchReset(true);
    pagingLockRef.current = false;
    resetScrollChrome();
  }, [apiQuery, filterKey, resetScrollChrome]);

  useEffect(() => {
    clearVisibleProductIds();
  }, [apiQuery, filterKey]);

  const [createRecentSearch] = useCreateRecentSearchMutation();

  // Effects
  useEffect(() => {
    // Don't save brand-landing as a typed recent search.
    if (brandBrowse || !apiQuery.trim()) return;
    if (isSuccess && apiQuery) {
      createAndFetchRecentSearch();
    }
  }, [isSuccess, apiQuery, userId, brandBrowse]);

  const createAndFetchRecentSearch = async () => {
    if (!userId || !apiQuery.trim()) return;
    try {
      if (isGuestUser) {
        await saveLocalRecentSearchItem(dispatch, userId, apiQuery);
        return;
      }
      await createRecentSearch({ body: { query: apiQuery, userId } })?.unwrap();
      const data = await fetchRecentSearch({ userId }, false)?.unwrap();
      if (data) {
        await upsertRecentSearchInStore(dispatch, userId, data);
        await writeRecentSearchCache(userId, data);
      }
    } catch {
      // ignore save failures
    }
  };

  useEffect(() => {
    if (brandBrowse || !apiQuery.trim()) return;
    dispatch(
      addSearchQuery({
        query: apiQuery,
      })
    );
  }, [apiQuery, brandBrowse, dispatch]);

  useEffect(() => {
    if (resetPagination?.status) {
      let id = resetPagination?.item?._id;
      let index = data?.results?.findIndex((item: any) => {
        return item._id === id;
      });
      let limit = 10;
      let page = Math.ceil((index + 1) / limit);
      let mLimit = page * limit;
    //  console.log("jhgee4567890", page, index);
      fetchProductsBySearch(
        {
          ...(apiQuery.trim() ? { query: apiQuery } : {}),
          type: "autocomplete",
          page: page,
          limit: 10,
          reset: true,
          filterKey,
          ...apiParams,
        },
        false
      )
        ?.unwrap()
        ?.finally(() => {
          dispatch(setResetPagination({ item: null, status: false }));
        });

      // setTimeout(() => {
      //   dispatch(searchApi.util.resetApiState());
      // }, 500);
      //dispatch(setResetPagination(false));
    }
  }, [resetPagination?.status, apiQuery, filterKey, apiParams]);

  // Handlers
  const fetchNextPage = useCallback(() => {
    if (pagingLockRef.current) return;
    pagingLockRef.current = true;
    setSearchReset(false);
    setPage((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!isFetching) {
      pagingLockRef.current = false;
    }
  }, [isFetching]);

  // const cartItemsMap = useMemo(() => {
  //   // console.log("cartDatashivam---------->");
  //    const map: Record<string, CartItem> = {};
  //    (cartData?.cart?.items || []).forEach((it) => {
  //      map[it.productId] = it;
  //    });
  //    return map;
  //  }, [cartData?.cart?.items]);

  const cartItemsMap = useMemo(() => {
    const map: Record<string, CartItem> = {};
    (cartData?.cart?.items || []).forEach((it) => {
      const id = String(it.productDetails?._id ?? it.productId ?? "");
      if (id) map[id] = it;
    });
    return map;
  }, [cartData?.cart?.items]);

  // const renderProductItem = ({
  //   item,
  //   index,
  // }: {
  //   item: Product;
  //   index: number;
  // }) => {
  //   console.log("cartData1234567890-",JSON.stringify(cartData))
  //   // const cartItem = cartData?.cart?.items?.find(
  //   //   (cartItem: CartItem) => cartItem?.productId === item._id
  //   // );
  //   const cartItem = cartItemsMap[item._id];
  //     const isVisible = visibleIds.has(item._id);
  //   // console.log("item1234567899870-",item)
  //   // console.log("cartItem19876234567890-",cartItem)
  //   return (
  //     <ProductItem
  //       key={item?._id || index}
  //       index={index}
  //       key={index}
  //       cartItem={cartItem}
  //       item={item}
  //     />
  //   );
  // };


  // const listData = useMemo(
  //   () => withPaginationSkeletons(data?.results, showPaginationSkeleton),
  //   [data?.results, showPaginationSkeleton],
  // );
  const listData = useMemo(
    () =>
      buildProductListData(data?.results, {
        showInitialSkeleton,
      }),
    [data?.results, showInitialSkeleton],
  );

  const isRefreshingFirstPage = isFetching && page === 1;

  const bottomPad =
  PRODUCT_LIST_PADDING_BOTTOM +
  Math.max(goToCartListPadding, GO_TO_CART_ESTIMATED_HEIGHT);

const listContentContainerStyle = useMemo(
  () => [
    styles.listContent,
    isRefreshingFirstPage && styles.listRefreshing,
    {
      paddingBottom:
      bottomPad,
    },
  ],
  [isRefreshingFirstPage, goToCartListPadding],
);

  const listContentStyle = useMemo(
    () => [
      styles.listContent,
      {
        paddingBottom:
          PRODUCT_LIST_PADDING_BOTTOM +
          goToCartListPadding,
      },
    ],
    [goToCartListPadding],
  );

  // const renderProductItem = useCallback(
  //   ({ item, index }: { item: ProductListRow; index: number }) => {
  //     if (isProductSkeleton(item)) {
  //       return <ProductItemSkeleton index={index} />;
  //     }

  //     const cartItem = cartItemsMap[item._id];
  //     return (
  //       <ProductItemWrapper
  //         item={item}
  //         index={index}
  //         quantity={cartItem?.quantity ?? 0}
  //       />
  //     );
  //   },
  //   [cartItemsMap],
  // );

  const renderProductItem = useCallback(
    ({ item, index }: { item: ProductListRow; index: number }) => {
      if (isProductSkeleton(item)) {
        return <ProductItemSkeletonStatic index={index} />;
      }
  
     
      const cartItem = cartItemsMap[item._id];
  
      return (
        <ProductItemWrapper
          item={item}
          index={index}
          quantity={cartItem?.quantity ?? 0}
        />
      );
    },
    [cartItemsMap],
  );

  const renderListFooter = useCallback(() => {
    if (showInitialSkeleton || !hasNextPage) return null;
    return <ProductPaginationSkeleton />;
  }, [showInitialSkeleton, hasNextPage]);
  
  const renderEmptyComponent = useCallback(() => {
    if (
      showInitialSkeleton ||
      isLoading ||
      (isFetching && (data?.results?.length ?? 0) === 0)
    ) {
      return null;
    }
    return (
      <View
        style={{
          opacity: isFetching && page === 1 ? 0.6 : 1,
          pointerEvents: isFetching && page === 1 ? "none" : "auto",
        }}
      >
        <NotFound
          title="Item not Found"
          subtitle="Try search with a different keyword"
        />
      </View>
    );
  }, [showInitialSkeleton, isFetching, isLoading, data?.results?.length, page]);

  const listEmptyComponent = () =>
    !isFetching ? (
      <NotFound
        title="Item not Found"
        subtitle="Try search with a different keyword"
      />
    ) : null;

  const header = () =>
    data?.totalResults !== undefined ? (
      <ThemedText
        type="title"
        style={styles.headerText}
      >{`Found ${data.totalResults} Results`}</ThemedText>
    ) : null;

  const showPlaceholder = !hasResults && (isLoading || isFetching);

  const handleEndReached = useCallback(async() => {
    if (showInitialSkeleton) return;
    if (!hasNextPage) return;
    if (isFetching) return;
    if (pagingLockRef.current) return;
    await new Promise(resolve => setTimeout(resolve, 300));
    fetchNextPage();
  }, [
    showInitialSkeleton,
    hasNextPage,
    isFetching,
    fetchNextPage,
  ]);

  const onMomentumScrollEnd = useCallback(() => {
    scrollEndedRef.current = 1;
    console.log("juhygfdsdfghjhgfd onMomentumScrollEnd",scrollEndedRef.current)
  }, []);
  const onMomentumScrollBegin = useCallback(() => {
    scrollEndedRef.current = 2;
    console.log("juhygfdsdfghjhgfd onMomentumScrollBegin",scrollEndedRef.current)
  }, []);
  const onScrollBeginDrag = useCallback(() => {
    scrollEndedRef.current = 3;
    console.log("juhygfdsdfghjhgfd onScrollBeginDrag",scrollEndedRef.current)
  }, []);
  const onScrollEndDrag = useCallback(() => {
    scrollEndedRef.current = 4;
    console.log("juhygfdsdfghjhgfd onScrollEndDrag",scrollEndedRef.current)
  }, []);
  console.log("juhygfdsdfghjhgfd scrollEndedRef.current",scrollEndedRef.current)

  return (
    <>
    <AppHead
      title={
        isBrandOnlyMode && browseBrandName
          ? `All ${browseBrandName}`
          : query?.trim()
            ? `“${query.trim()}”`
            : "Search"
      }
    />

      <ScreenSafeWrapper showCartIcon>
        
          <DeferredFadeIn delay={100} style={{flex:1}}>
            <CustomTextInput
              onChangeText={() => {}}
              value={isBrandOnlyMode ? "" : query}
              type="search"
              variant={2}
              onPress={() => {
                // Leave brand landing — type a normal search.
                dispatch(setCurrentSearchQuery(""));
                router.back();
                router.navigate("/(search)/search");
              }}
              wrapperStyle={styles.textInputWrapper}
              numberOfLines={1}
              textInputStyle={
                isBrandOnlyMode ? styles.brandBrowseInput : undefined
              }
            />
            {isBrandOnlyMode && browseBrandName ? (
              <View style={styles.brandBrowseBanner}>
                <Text style={styles.brandBrowseLabel}>Showing all products from</Text>
                <Text style={styles.brandBrowseName} numberOfLines={1}>
                  {browseBrandName}
                </Text>
              </View>
            ) : null}
            <ProductFilterFab
              filters={applied}
              onPress={handleOpenFilters}
              onClear={clearAll}
              barStyle={{ paddingHorizontal: 0 }}
              resultCount={data?.totalResults}
              loadedCount={data?.results?.length}
            />
            {showPlaceholder ? (
              <View style={styles.container}>
                {/* <ProductListPlaceholder
                  contentContainerStyle={listContentStyle}
                /> */}
                <ProductListPlaceholder contentContainerStyle={listContentStyle} />
              </View>
            ) : error ? (
              <Text style={styles.errorText}>Error loading data</Text>
            ) : (
              <View style={[styles.container, Platform.OS === "web" ? { height: '100vh' } : {}]}>
                <FlatList
                  key={`${apiQuery}-${filterKey}-${isBrandOnlyMode ? "brand" : "search"}`}
                  bounces={Platform.OS === "android" ? false : true}
                  initialNumToRender={10}
                  data={data?.results}
                  extraData={{ cartItemsMap }}
                  renderItem={renderProductItem}
                  keyExtractor={(item) => String(item?._id)}
                  numColumns={2}
                  removeClippedSubviews={false}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={!showInitialSkeleton}
                  onEndReached={handleEndReached}
                  onScrollEndDrag={onScrollEndDrag}
                  onEndReachedThreshold={0.35}
                  contentContainerStyle={listContentContainerStyle}
                  //ListHeaderComponent={header}
                  ListEmptyComponent={renderEmptyComponent}
                  ListFooterComponent={renderListFooter}
                  ListFooterComponentStyle={hasNextPage ? [styles.listFooter] : undefined}
                  onMomentumScrollEnd={onMomentumScrollEnd}
                  onMomentumScrollBegin={onMomentumScrollBegin}
                  onScrollBeginDrag={onScrollBeginDrag}
                />
              </View>
            )}
          </DeferredFadeIn>
       
      </ScreenSafeWrapper>

      <LazyProductFilterSheet
        visible={filterVisible}
        draft={draft}
        onChange={setDraft}
        brands={brands}
        brandsLoading={brandsLoading}
        onApply={applyDraft}
        onClear={() => {
          setDraft(DEFAULT_PRODUCT_FILTERS);
          clearAll();
        }}
        onClose={closeFilters}
      />

      <GoToCartWrapper extraBottomOffset={Platform.OS === "web" ? -10 : 0}/>
    </>
  );
};

export default memo(QueryResult);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  textInputWrapper: {
    marginTop: 25,
    marginBottom: 10,
  },
  brandBrowseInput: {
    color: Colors.light.mediumLightGrey,
  },
  brandBrowseBanner: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: Colors.light.softGrey_1,
  },
  brandBrowseLabel: {
    fontSize: 13,
    fontFamily: "Montserrat_500Medium",
    color: Colors.light.mediumGrey,
  },
  brandBrowseName: {
    fontSize: 13,
    fontFamily: "Raleway_700Bold",
    color: Colors.light.darkGreen,
    textTransform: "capitalize",
    flexShrink: 1,
  },
  errorText: {
    textAlign: "center",
    marginTop: 20,
  },
  headerText: {
    color: Colors.light.darkGreen,
    fontSize: 18,
    marginBottom: 25,
    fontFamily: "Montserrat_500Medium",
  },
  listContent: {
    paddingTop: 15,
    paddingBottom: 30,
  },
  loaderContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
  },
  loaderText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.light.lightGreen,
  },
  listRefreshing: {
    opacity: 0.6,
    pointerEvents: "none",
  },
  listFooter: {
    height: 200,
  },
});
