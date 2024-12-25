import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  Alert,
  FlatList,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import {
  searchApi,
  useFetchProductsBySearchQuery,
} from "@/redux/features/searchSlice";
import { useCreateRecentSearchMutation } from "@/redux/features/recentSearchSlice";
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
import { setResetPagination } from "@/redux/features/productSlice";

const Result = () => {
  const { query } = useLocalSearchParams<{ query: string }>();
  const userId = useSelector((state: RootState) => state.auth?.userData?._id);
  const resetPagination = useSelector(
    (state: RootState) => state.product?.resetPagination
  );
  const [page, setPage] = useState(1);
  const dispatch = useDispatch();
  const { data: cartData } = useFetchCartQuery({ userId }, { skip: !userId });

  const { data, isFetching, error, isSuccess, isLoading } =
    useFetchProductsBySearchQuery(
      { query, type: "autocomplete", page, limit: 10 },
      { skip: !query }
    );

  const [createRecentSearch] = useCreateRecentSearchMutation();

  // Effects
  useEffect(() => {
    if (isSuccess && query) {
      createRecentSearch({ body: { query, userId } });
    }
  }, [isSuccess, query, userId]);

  useEffect(() => {
    if (resetPagination) {
      setPage(1);
      setTimeout(() => {
        dispatch(searchApi.util.resetApiState());
      }, 500);
      dispatch(setResetPagination(false));
    }
  }, [resetPagination]);

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
        />
        {isLoading ? (
          <ProductListPlaceholder />
        ) : error ? (
          <Text style={styles.errorText}>Error loading data</Text>
        ) : (
          <View style={styles.container}>
            <FlatList
              //disableAutoLayout
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
