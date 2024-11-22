import {
  ActivityIndicator,
  Button,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import CustomTextInput from "@/components/CustomTextInput";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { CartItem, Product, RootState } from "@/types/global";
import ProductItem from "../(category)/ProductList/ProductItem";
import { useFetchCartQuery } from "@/redux/features/cartSlice";
import { FlashList } from "@shopify/flash-list";
import { Colors } from "@/constants/Colors";
import { ThemedText } from "@/components/ThemedText";
import NotFound from "./NotFound";
import { baseUrl } from "@/redux/constants";
import { useFetchProductsBySearchQuery } from "@/redux/features/searchSlice";
import { Alert } from "react-native";
import { useCreateRecentSearchMutation } from "@/redux/features/recentSearchSlice";
import ProductListPlaceholder from "../(category)/ProductList/ProductListPlaceholder";
import ContentLoader, { Rect } from "react-content-loader/native";
import GoToCart from "../(category)/ProductList/GoToCart";

const result = () => {
  const { query } = useLocalSearchParams<{ query: string }>();
  const token = useSelector((state: RootState) => state?.auth?.token);
  const [page, setPage] = useState(1);
  const cartButtonProductId = useSelector(
    (state: RootState) => state.cart.cartButtonProductId
  );
  const userId = useSelector((state: RootState) => state?.auth?.userData?._id);
  const { data: cartData } = useFetchCartQuery(
    {
      userId,
    },
    {
      skip: !userId,
    }
  );
  const { data, isFetching, error, isSuccess, isLoading } =
    useFetchProductsBySearchQuery(
      { query: query, type: "autocomplete", page: page, limit: 10 },
      { skip: query.length == 0 }
    );
  const [createRecentSearch] = useCreateRecentSearchMutation();

  useEffect(() => {
    if (isSuccess) {
      createRecentSearch({
        body: { query, userId },
      });
    }
  }, [isSuccess]);

  const renderProductItem = ({
    item,
    index,
  }: {
    item: Product;
    index: number;
  }) => {
    console.log("jhgfdfghj", cartData?.cart?.items);
    const cartItem = cartData?.cart?.items?.find(
      (cartItem: CartItem) => cartItem.productId === item._id
    );
    if (cartItem) {
      console.log("iuytrdfghjkl", cartItem);
    }

    return (
      <ProductItem key={index} cartItem={cartItem} item={item} index={index} />
    );
  };

  const hasNextPage = data?.currentPage < data?.totalPages;
  const totalCount = data?.totalResults;

  const renderLoader = () => {
    //if (!hasNextPage) return null;
    return isFetching ? (
      <ActivityIndicator size="large" color={Colors.light.lightGreen} />
    ) : null;
  };
  console.log("kjhgfdfghjkl;", data);
  const Header = () => {
    if (totalCount === undefined) return null;
    return (
      <ThemedText
        type="title"
        style={{
          color: Colors.light.darkGreen,
          fontSize: 20,
          marginBottom: 25,
        }}
      >
        {`Found ${totalCount} Results`}
      </ThemedText>
    );
  };
  const fetchNextPage = () => {
    setPage((prev) => prev + 1);
  };

  return (
    <>
      <ScreenSafeWrapper showCartIcon>
        <CustomTextInput
          onChangeText={() => {}}
          value={query}
          type={"search"}
          variant={2}
          onPress={() => {
            console.log("hi");
            router.back();
          }}
          wrapperStyle={{ marginTop: 25, marginBottom: 10 }}
        />
        {isLoading ? (
          <View>
            <ProductListPlaceholder />
          </View>
        ) : error ? (
          <Text>Error loading data</Text>
        ) : (
          <View style={{ flex: 1 }}>
            <FlashList
              extraData={cartData}
              // ListHeaderComponent={<Header />}
              estimatedItemSize={277}
              showsVerticalScrollIndicator={false}
              numColumns={2}
              data={data?.results}
              renderItem={renderProductItem}
              keyExtractor={(item, index) => item?._id || index.toString()}
              onEndReached={() => {
                if (isFetching) return;
                if (hasNextPage) fetchNextPage();
              }}
              onEndReachedThreshold={0.1}
              ListFooterComponent={renderLoader}
              contentContainerStyle={styles.flatList}
              ListEmptyComponent={
                isFetching ? null : (
                  <NotFound
                    title={"Item not Found"}
                    subtitle={"Try search with a different keyword"}
                  />
                )
              }
            />
          </View>
        )}
      </ScreenSafeWrapper>
      <GoToCart />
    </>
  );
};

export default result;

const styles = StyleSheet.create({
  flatList: {
    // paddingBottom: Platform.OS === "android" ? 80 : 70,
    paddingTop: 15,
    paddingBottom: 50,
  },
});
