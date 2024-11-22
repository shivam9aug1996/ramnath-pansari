import {
  ActivityIndicator,
  Button,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import React from "react";
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

const result = () => {
  const { query } = useLocalSearchParams<{ query: string }>();
  const token = useSelector((state: RootState) => state?.auth?.token);

  const userId = useSelector((state: RootState) => state?.auth?.userData?._id);
  const { data: cartData } = useFetchCartQuery(
    {
      userId,
    },
    {
      skip: !userId,
    }
  );
  const fetchProjects = async ({ pageParam }: number) => {
    console.log("hiii");
    const res = await fetch(
      `${baseUrl}/search?page=` +
        pageParam +
        "&limit=10" +
        "&query=" +
        query +
        "&type=autocomplete",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("iuytfghjkl", res);
    return res.json();
  };

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["search", { query: query }],

    queryFn: fetchProjects,
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => {
      return pages[0]?.totalPages > lastPage?.currentPage
        ? lastPage.currentPage + 1
        : undefined;
    },
    enabled: query ? true : false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

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

    return <ProductItem cartItem={cartItem} item={item} index={index} />;
  };

  const renderLoader = () => {
    if (!hasNextPage) return null;
    return <ActivityIndicator size="large" color="#0000ff" />;
  };
  console.log("kjhgfdfghjkl;", data?.pages);
  const Header = () => {
    if (data?.pages[0]?.totalResults === undefined) return null;
    return (
      <ThemedText
        type="title"
        style={{
          color: Colors.light.darkGreen,
          fontSize: 20,
          marginBottom: 25,
        }}
      >
        {`Found ${data?.pages[0]?.totalResults} Results`}
      </ThemedText>
    );
  };
  return (
    <ScreenSafeWrapper showCartIcon>
      <CustomTextInput
        onChangeText={() => {}}
        value={query}
        type={"search"}
        variant={2}
        onPress={() => {
          console.log("hi");
          router.navigate("/(search)/search");
        }}
        wrapperStyle={{ marginTop: 37, marginBottom: 10 }}
      />

      {error ? (
        <Text>Error loading data</Text>
      ) : (
        <FlashList
          ListHeaderComponent={
            !isFetching && data?.pages[0]?.totalResults !== 0 ? (
              <Header />
            ) : null
          }
          estimatedItemSize={257.33}
          showsVerticalScrollIndicator={false}
          numColumns={2}
          data={data?.pages.flatMap((page) => page.results)}
          renderItem={renderProductItem}
          keyExtractor={(item, index) => item.id || index.toString()}
          onEndReached={() => {
            if (isFetchingNextPage || isFetching) return;
            if (hasNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderLoader}
          contentContainerStyle={styles.flatList}
          ListEmptyComponent={!isFetching ? <NotFound /> : null}
        />
      )}
    </ScreenSafeWrapper>
  );
};

export default result;

const styles = StyleSheet.create({
  flatList: {
    // paddingBottom: Platform.OS === "android" ? 80 : 70,
    paddingTop: 15,
  },
});
