import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useCallback, useState } from "react";
import OrderComp from "./OrderComp";
import Push from "./Push";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import { useFetchOrdersQuery } from "@/redux/features/orderSlice";
import { RootState } from "@/types/global";
import { useSelector } from "react-redux";
import { FlashList } from "@shopify/flash-list";
import { Colors } from "@/constants/Colors";
import NotFound from "../(result)/NotFound";
import ProductListPlaceholder from "../(category)/ProductList/ProductListPlaceholder";
import ImageDisplay from "./ImageDisplay";
import { mockOrders } from "./mock";
import { getOrderStatusTitle } from "./utils";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import OrderListPlaceHolder from "./OrderListPlaceHolder";
import CustomSuspense from "@/components/CustomSuspense";
import { formatNumber } from "@/utils/utils";
import OrderItem from "./OrderItem";
import useOrderListStageLoad from "@/hooks/useOrderListStageLoad";
import FadeSlideIn from "@/app/components/FadeSlideIn";
import DeferredFadeIn from "@/components/DeferredFadeIn";
const Order = () => {
  const userId = useSelector((state: RootState) => state?.auth?.userData?._id);
  const [page, setPage] = useState(1);
  const {
    data: orderData,
    isLoading: isOrderLoading,
    isFetching: isOrderFetching,
    error: orderError,
  } = useFetchOrdersQuery(
    { userId: userId, limit: 10, page: page },
    { skip: !userId }
  );

  const hasNextPage = orderData?.currentPage < orderData?.totalPages;

  const renderLoader = () => {
    return isOrderFetching ? (
      <ActivityIndicator size="large" color={Colors.light.lightGreen} />
    ) : null;
  };

  const fetchNextPage = () => {
    setPage((prev) => prev + 1);
  };

  const renderProductItem = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      return <OrderItem key={item?._id || index} item={item} index={index} />;
    },
    []
  );
  return (
    <>
      <ScreenSafeWrapper title="My Orders">
       <DeferredFadeIn delay={0} style={{flex:1}}>
       <View style={{ height: 10 }}></View>
        <View style={{ flex: 1 }}>
         
            <>
              {isOrderLoading ? (
                <View>
                  <OrderListPlaceHolder />
                </View>
              ) : orderError ? (
                <Text>Error loading data</Text>
              ) : (
                <FlatList
                initialNumToRender={5}
                  bounces={Platform.OS === "android" ? false : true}
                  // disableAutoLayout
                  ItemSeparatorComponent={() => (
                    <View style={{ height: 15 }}></View>
                  )}
                  // estimatedItemSize={277}
                  showsVerticalScrollIndicator={false}
                  data={orderData?.orders}
                  // data={mockOrders}
                  renderItem={renderProductItem}
                  keyExtractor={(item, index) =>
                    item?._id + index || index.toString()
                  }
                  onEndReached={() => {
                    if (isOrderFetching) return;
                    if (hasNextPage) fetchNextPage();
                  }}
                  onEndReachedThreshold={0.1}
                  ListFooterComponent={renderLoader}
                  contentContainerStyle={styles.flatList}
                  ListFooterComponentStyle={{ paddingTop: 15 }}
                  ListEmptyComponent={
                    isOrderFetching ? null : (
                      <NotFound
                        title={"Order not Found"}
                        subtitle={"You haven't placed any order yet."}
                      />
                    )
                  }
                />
              )}
            </>
          
        </View>
       </DeferredFadeIn>
      </ScreenSafeWrapper>
    </>
  );
};

export default Order;

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "#F1F4F3",
    borderRadius: 23,
    alignItems: "center",
  },
  itemContent: {
    flex: 1,
    marginLeft: 15,
    justifyContent: "space-between",
  },
  orderStatus: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 12,
    color: Colors.light.darkGrey,
    //marginBottom: 8,
  },
  detailsWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productCountText: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 14,
    color: Colors.light.darkGrey,
  },
  amountText: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 16,
    color: Colors.light.lightGreen,
  },
  flatList: {
    paddingTop: 10,
    //  paddingBottom: 50,
  },
  statusWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingRight: 10,
  },
  statusCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 3,
  },
});
