import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  Alert,
  FlatList,
  Platform,
  ViewToken,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import {
  searchApi,
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
  writeRecentSearchCache,
} from "@/utils/recentSearchConfigCache";
import { useFetchCartQuery } from "@/redux/features/cartSlice";
import { FlashList } from "@shopify/flash-list";

import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import CustomTextInput from "@/components/CustomTextInput";
import ProductItem from "../(category)/ProductList/ProductItem";
import ProductListPlaceholder, {
  ProductItemSkeleton,
  ProductItemSkeletonStatic,
  ProductPaginationSkeleton,
} from "../(category)/ProductList/ProductListPlaceholder";
import {
  buildProductListData,
  isProductSkeleton,
  PRODUCT_LIST_ITEM_SEPARATOR_HEIGHT,
  PRODUCT_LIST_MARGIN_TOP,
  PRODUCT_LIST_PADDING_BOTTOM,
  ProductListRow,
  withPaginationSkeletons,
} from "../(category)/ProductList/productListLayout";
import NotFound from "./NotFound";
import GoToCartWrapper from "../(category)/ProductList/GoToCartWrapper";
import { useHideOnScroll } from "@/hooks/useHideOnScroll";
import { usePaginationSkeleton } from "@/hooks/usePaginationSkeleton";

import { Colors } from "@/constants/Colors";
import { ThemedText } from "@/components/ThemedText";
import { RootState, CartItem, Product } from "@/types/global";
import {
  setProductListScrollParams,
  setQueryResultVisibleIds,
  setResetPagination,
  setVisibleIds,
  useLazyFetchProductsQuery,
} from "@/redux/features/productSlice";
import { addSearchQuery } from "@/redux/features/recentlyViewedSlice";
import useResultStageLoad from "@/hooks/useResultStageLoad";
import DeferredFadeIn from "@/components/DeferredFadeIn";
import ProductItemWrapper from "../(category)/ProductList/ProductItemWrapper";
import { useGoToCartListPadding } from "@/contexts/DeliveryFloatContext";
import { clearVisibleProductIds, updateVisibleProductIds } from "../(category)/ProductList/productVisibilityStore";

const QueryResult = ({query}:{query:string}) => {
 
  const userId = useSelector((state: RootState) => state.auth?.userData?._id);
  const isGuestUser = useSelector(
    (state: RootState) => state.auth?.userData?.isGuestUser,
  );
  const resetPagination = useSelector(
    (state: RootState) => state.product?.resetPagination
  );
  const [fetchRecentSearch] = useLazyFetchRecentSearchQuery();
  // const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  // const visibleIdsRef = useRef(visibleIds);
  // const onViewableItemsChanged = useRef(
  //   ({ viewableItems }: { viewableItems: ViewToken[] }) => {
  //     const visibleNow = new Set<string>();
  //     viewableItems.forEach((v) => {
  //       const id = v?.item?._id;
  //       if (typeof id === "string" && id.length) visibleNow.add(id);
  //     });
  //     dispatch(setVisibleIds(Array.from(visibleNow) as string[]));
  //   }
  // ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 1, // consider visible when 20% is on screen
    waitForInteraction: false,
  }).current;
 // visibleIdsRef.current = visibleIds;

  const [page, setPage] = useState(1);
  const dispatch = useDispatch();
  const goToCartListPadding = useGoToCartListPadding();
  const { data: cartData } = useFetchCartQuery({ userId }, { skip: !userId });
  const [fetchProductsBySearch] = useLazyFetchProductsBySearchQuery();

  const { data, isFetching, error, isSuccess, isLoading } =
    useFetchProductsBySearchQuery(
      { query, type: "autocomplete", page, limit: 10 },
      { skip: !query }
    );

  const hasNextPage = data?.currentPage < data?.totalPages;

const { showSkeleton: showPaginationSkeleton, beginPaging, isPagingMore } =
  usePaginationSkeleton({
    isFetching,
    page,
    hasItems: (data?.results?.length ?? 0) > 0,
    hasNextPage,
    itemCount: data?.results?.length ?? 0,
  });
  const hasResults = (data?.results?.length ?? 0) > 0;

  const showInitialSkeleton = !hasResults && (isLoading || isFetching);


  const isLoadingMoreRef = useRef(showPaginationSkeleton);
  isLoadingMoreRef.current = showPaginationSkeleton;

  const onChromeVisibilityChange = useCallback(
    (hidden: boolean) => {
     // if (!hidden && isLoadingMoreRef.current) return;
      dispatch(setProductListScrollParams({ shouldHideChrome: hidden }));
    },
    [dispatch],
  );

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const ids: string[] = [];
      for (const v of viewableItems) {
        const item = v.item as ProductListRow | undefined;
        if (!item || isProductSkeleton(item)) continue;
        ids.push(item._id);
      }
      updateVisibleProductIds(ids);
    },
  ).current;

  const { handleScroll, reset: resetScrollChrome } = useHideOnScroll(
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
    resetScrollChrome();
  }, [query, resetScrollChrome]);

  useEffect(() => {
    clearVisibleProductIds();
  }, []);

  const [createRecentSearch] = useCreateRecentSearchMutation();

  // Effects
  useEffect(() => {
    if (isSuccess && query) {
      createAndFetchRecentSearch();
    }
  }, [isSuccess, query, userId]);

  const createAndFetchRecentSearch = async () => {
    if (!userId || !query) return;
    try {
      if (isGuestUser) {
        await saveLocalRecentSearchItem(dispatch, userId, query);
        return;
      }
      await createRecentSearch({ body: { query, userId } })?.unwrap();
      const data = await fetchRecentSearch({ userId }, false)?.unwrap();
      if (data) {
        await writeRecentSearchCache(userId, data);
      }
    } catch {
      // ignore save failures
    }
  };

  useEffect(() => {
    if (query) {
      dispatch(
        addSearchQuery({
          query: query,
        })
      );
    }
  }, [query]);

  useEffect(() => {
    clearVisibleProductIds();
  }, [query]); 

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
          query,
          type: "autocomplete",
          page: page,
          limit: 10,
          reset: true,
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
  }, [resetPagination?.status, query]);

  // Handlers
  const fetchNextPage = () => setPage((prev) => prev + 1);

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
        showPaginationSkeleton,
      }),
    [data?.results, showInitialSkeleton, showPaginationSkeleton],
  );

  const isRefreshingFirstPage = isFetching && page === 1;
const listContentContainerStyle = useMemo(
  () => [
    styles.listContent,
    isRefreshingFirstPage && styles.listRefreshing,
    { paddingBottom: PRODUCT_LIST_PADDING_BOTTOM + goToCartListPadding },
  ],
  [isRefreshingFirstPage, goToCartListPadding],
);

  const listContentStyle = useMemo(
    () => [
      styles.listContent,
      { paddingBottom: PRODUCT_LIST_PADDING_BOTTOM + goToCartListPadding },
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
    if (showInitialSkeleton || !showPaginationSkeleton) return null;
    return <ProductPaginationSkeleton />;
  }, [showInitialSkeleton, showPaginationSkeleton]);
  
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

  const handleEndReached = useCallback(() => {
    if (showInitialSkeleton) return;
    if (!hasNextPage) return;
    if (isFetching) return;
    if (showPaginationSkeleton || isPagingMore) return;
    beginPaging();
    fetchNextPage();
  }, [
    showInitialSkeleton,
    hasNextPage,
    isFetching,
    showPaginationSkeleton,
    isPagingMore,
    beginPaging,
    fetchNextPage,
  ]);

  return (
    <>
      <ScreenSafeWrapper showCartIcon>
        
          <DeferredFadeIn delay={100} style={{flex:1}}>
            <CustomTextInput
              onChangeText={() => {}}
              value={query}
              type="search"
              variant={2}
              onPress={() => {
                dispatch(setCurrentSearchQuery(query));
                router.back();
                router.navigate("/(search)/search");
              }}
              wrapperStyle={styles.textInputWrapper}
              numberOfLines={1}
            />
            {showPlaceholder ? (
              <View style={styles.container}>
                <ProductListPlaceholder
                  contentContainerStyle={listContentStyle}
                />
              </View>
            ) : error ? (
              <Text style={styles.errorText}>Error loading data</Text>
            ) : (
              <View style={styles.container}>
                <FlatList
                  key={query}
                  bounces={Platform.OS === "android" ? false : true}
                  //disableAutoLayout
                  initialNumToRender={6}
                  maxToRenderPerBatch={showPaginationSkeleton ? 8 : 2}
                  windowSize={showPaginationSkeleton ? 7 : 5}
                  data={listData}
                  extraData={{ showInitialSkeleton, showPaginationSkeleton, cartItemsMap }}
                  renderItem={renderProductItem}
                  keyExtractor={(item, index) => item?._id || index.toString()}
                  numColumns={2}
                  removeClippedSubviews={false}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={!showInitialSkeleton}
                  onEndReached={handleEndReached}
                  onEndReachedThreshold={0.35}
                  contentContainerStyle={listContentContainerStyle}
                  ListHeaderComponent={header}
                  ListEmptyComponent={renderEmptyComponent}
                  ListFooterComponent={renderListFooter}

                  // ItemSeparatorComponent={() => (
                  //   <View style={{ height: PRODUCT_LIST_ITEM_SEPARATOR_HEIGHT }} />
                  // )}
                  // viewabilityConfig={viewabilityConfig}
                  // onViewableItemsChanged={onViewableItemsChanged}
                  scrollEventThrottle={50}
                  onScroll={handleScroll}

                />
              </View>
            )}
          </DeferredFadeIn>
       
      </ScreenSafeWrapper>

      <GoToCartWrapper />
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
});
