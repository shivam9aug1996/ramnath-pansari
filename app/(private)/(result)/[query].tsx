import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  Alert,
  FlatList,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import {
  searchApi,
  useFetchProductsBySearchQuery,
  useLazyFetchProductsBySearchQuery,
} from "@/redux/features/searchSlice";
import {
  useCreateRecentSearchMutation,
  useLazyFetchRecentSearchQuery,
} from "@/redux/features/recentSearchSlice";
import { useFetchCartQuery } from "@/redux/features/cartSlice";
import { FlashList } from "@shopify/flash-list";

import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import CustomTextInput from "@/components/CustomTextInput";
import ProductItem from "../(category)/ProductList/ProductItem";
import ProductListPlaceholder from "../(category)/ProductList/ProductListPlaceholder";
import NotFound from "./NotFound";
import GoToCart from "../(category)/ProductList/GoToCart";

import { Colors } from "@/constants/Colors";
import { ThemedText } from "@/components/ThemedText";
import { RootState, CartItem, Product } from "@/types/global";
import {
  setResetPagination,
  useLazyFetchProductsQuery,
} from "@/redux/features/productSlice";

const Result = () => {
  const { query } = useLocalSearchParams<{ query: string }>();
  const userId = useSelector((state: RootState) => state.auth?.userData?._id);
  const resetPagination = useSelector(
    (state: RootState) => state.product?.resetPagination
  );
  const [fetchRecentSearch] = useLazyFetchRecentSearchQuery();

  const [page, setPage] = useState(1);
  const dispatch = useDispatch();
  const { data: cartData } = useFetchCartQuery({ userId }, { skip: !userId });
  const [fetchProductsBySearch] = useLazyFetchProductsBySearchQuery();

  const { data, isFetching, error, isSuccess, isLoading } =
    useFetchProductsBySearchQuery(
      { query, type: "autocomplete", page, limit: 10 },
      { skip: !query }
    );

  const [createRecentSearch] = useCreateRecentSearchMutation();

  // Effects
  useEffect(() => {
    if (isSuccess && query) {
      createAndFetchRecentSearch();
    }
  }, [isSuccess, query, userId]);

  const createAndFetchRecentSearch = async () => {
    await createRecentSearch({ body: { query, userId } })?.unwrap();
    await fetchRecentSearch({ userId }, false)?.unwrap();
  };

  useEffect(() => {
    if (resetPagination?.status) {
      let id = resetPagination?.item?._id;
      let index = data?.results?.findIndex((item: any) => {
        return item._id === id;
      });
      let limit = 10;
      let page = Math.ceil((index + 1) / limit);
      let mLimit = page * limit;
      console.log("jhgee4567890", page, index);
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

  const renderProductItem = ({
    item,
    index,
  }: {
    item: Product;
    index: number;
  }) => {
    const cartItem = cartData?.cart?.items?.find(
      (cartItem: CartItem) => cartItem.productId === item._id
    );

    return (
      <ProductItem
        key={item?._id || index}
        index={index}
        key={index}
        cartItem={cartItem}
        item={item}
      />
    );
  };

  const renderLoader = () =>
    isFetching ? (
      <ActivityIndicator size="large" color={Colors.light.lightGreen} />
    ) : null;

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

  const hasNextPage = data?.currentPage < data?.totalPages;

  const handleEndReached = () => {
    if (!isFetching && hasNextPage) fetchNextPage();
  };

  return (
    <>
      <ScreenSafeWrapper showCartIcon>
        <CustomTextInput
          onChangeText={() => {}}
          value={query}
          type="search"
          variant={2}
          onPress={() => router.back()}
          wrapperStyle={styles.textInputWrapper}
          numberOfLines={1}
        />
        {isLoading ? (
          <ProductListPlaceholder />
        ) : error ? (
          <Text style={styles.errorText}>Error loading data</Text>
        ) : (
          <View style={styles.container}>
            <FlatList
            bounces={Platform.OS === "android" ? false : true}
              //disableAutoLayout
              initialNumToRender={4}
              maxToRenderPerBatch={4}
              windowSize={2}
              data={data?.results}
              extraData={cartData}
              renderItem={renderProductItem}
              keyExtractor={(item, index) => item?._id || index.toString()}
              // estimatedItemSize={277}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              onEndReached={handleEndReached}
              onEndReachedThreshold={0.1}
              ListFooterComponent={renderLoader}
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={header}
              ListEmptyComponent={listEmptyComponent}
              ItemSeparatorComponent={() => <View style={{ height: 20 }} />}
              ListFooterComponentStyle={{ paddingTop: 15 }}
            />
          </View>
        )}
      </ScreenSafeWrapper>
      <GoToCart />
    </>
  );
};

export default Result;

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
    // paddingBottom: 50,
  },
});
