import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  Alert,
} from "react-native";
import React, {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  addressApi,
  setCurrentAddressData,
  useFetchAddressQuery,
} from "@/redux/features/addressSlice";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/types/global";
import { Colors } from "@/constants/Colors";
import { scrollToTop } from "../(category)/ProductList/utils";
import AddressItem from "./AddressItem";
import { ThemedText } from "@/components/ThemedText";
import NotFound from "../(result)/NotFound";
import AddressPlaceholder from "./AddressPlaceholder";
import TryAgain from "../(category)/CategoryList/TryAgain";

import * as Linking from "expo-linking";
import usePayment from "./usePayment";
import Button from "@/components/Button";
import LottieSuccess from "./LottieSuccess";
import { usePreloadAssets } from "@/hooks/usePreloadAssets";

const addressList = () => {
  const params = useLocalSearchParams();
  const cartButtonProductId = useSelector(
    (state: RootState) => state.cart.cartButtonProductId
  );
  const totalAmount = useSelector((state: RootState) => state.cart.totalAmount);
  const totalAmountInNumber = useSelector(
    (state: RootState) => state.cart.totalAmountInNumber
  );

  const checkoutFlow = useSelector(
    (state: RootState) => state.order.checkoutFlow
  );

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );
  const dispatch = useDispatch();
  const url = Linking.useURL();

  const userId = useSelector((state: RootState) => state?.auth?.userData?._id);
  const { isLoading, data, error, isFetching, isSuccess, refetch } =
    useFetchAddressQuery({ userId }, { skip: !userId });
  const listRef = useRef<FlatList>(null);
  const { handleOnClick, isPaymentProcessing, isRazorpayOpened } = usePayment();
  useEffect(() => {
    if (isFetching) {
      scrollToTop(listRef);
    }
  }, [isFetching]);

  const handleIncomingURL = (event) => {
    console.log("Received URL:", event);
    // Parse and handle the URL as needed
  };

  useEffect(() => {
    if (checkoutFlow) {
      if (data?.[0]?._id) {
        setSelectedAddressId(data?.[0]?._id);
      } else {
        setSelectedAddressId(null);
      }
    }
  }, [checkoutFlow, data]);

  const renderAddressItem = ({ item, index }: { item: any; index: number }) => (
    <AddressItem
      key={item?._id || index}
      item={item}
      userId={userId}
      selected={item?._id === selectedAddressId}
      onSelect={handleSelect}
      checkoutFlow={checkoutFlow}
    />
  );

  const handleSelect = (id: string) => {
    setSelectedAddressId(id);
  };
  console.log("876trfghjk", data);

  const refetchMe = () => {
    refetch();
    dispatch(addressApi.util.resetApiState());
  };

  if (isRazorpayOpened) {
    return <LottieSuccess />;
  }

  return (
    <ScreenSafeWrapper>
      <View
        style={{
          flexDirection: "row",
          marginTop: 37,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row" }}>
          <ThemedText
            style={[styles.headerTitle, { fontSize: checkoutFlow ? 18 : 20 }]}
          >{`${
            checkoutFlow
              ? data?.length == 0
                ? "Add Delivery Address"
                : "Choose Delivery Address"
              : "Saved Addresses"
          }`}</ThemedText>
        </View>
        <TouchableOpacity
          onPress={() => {
            dispatch(
              setCurrentAddressData({
                action: "add",
                form: undefined,
                initialForm: undefined,
              })
            );
            router.push({
              // pathname: "/(address)/addAddress",
              pathname: "/(address)/mapSelect",
            });
          }}
        >
          <Text
            style={{
              color: Colors.light.mediumGreen,
              fontFamily: "Raleway_400Regular",
              fontSize: 14,
            }}
          >
            add new
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <AddressPlaceholder />
      ) : error ? (
        <TryAgain refetch={refetchMe} />
      ) : data?.length ? (
        <FlatList
          extraData={checkoutFlow || selectedAddressId}
          ref={listRef}
          data={data}
          keyExtractor={(item) => item._id}
          renderItem={renderAddressItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          style={{ marginTop: 20 }}
        />
      ) : checkoutFlow ? (
        <NotFound
          title={"Where Should We Deliver?"}
          subtitle={"Add an address to get started with your orders."}
          style={{ flex: 0.4, marginHorizontal: 50 }}
        />
      ) : (
        <NotFound
          title={"No Saved Addresses"}
          subtitle={
            "Add an address to quickly fill in your details at checkout."
          }
          style={{ flex: 0.4, marginHorizontal: 50 }}
        />
      )}

      {checkoutFlow && data?.length ? (
        <Button
          isLoading={cartButtonProductId?.length != 0 || isPaymentProcessing}
          title={`Pay ${totalAmount}`}
          onPress={() => {
            const addressData = data?.find((item) => {
              return item?._id == selectedAddressId;
            });
            console.log("kjhyt567890-", addressData, totalAmountInNumber);

            handleOnClick(totalAmountInNumber, addressData);
          }}
          textStyle={{ fontFamily: "Montserrat_600SemiBold" }}
        />
      ) : null}
    </ScreenSafeWrapper>
  );
};

export default addressList;

const styles = StyleSheet.create({
  listContainer: {
    paddingVertical: 10,
  },

  loadingText: {
    textAlign: "center",
    marginTop: 20,
    fontFamily: "Raleway_400Regular",
    color: Colors.light.mediumGrey,
  },
  errorText: {
    textAlign: "center",
    marginTop: 20,
    fontFamily: "Raleway_400Regular",
    color: Colors.light.lightRed,
  },
  noAddressText: {
    textAlign: "center",
    marginTop: 20,
    fontFamily: "Raleway_400Regular",
    color: Colors.light.mediumGrey,
  },
  addButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    paddingVertical: 15,
    backgroundColor: Colors.light.softGreen,
    borderRadius: 10,
    marginHorizontal: 20,
  },
  addButtonText: {
    marginLeft: 10,
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 16,
    color: Colors.light.tintColorLight,
  },

  leftAction: {
    backgroundColor: Colors.light.lightRed,
    justifyContent: "center",
    flex: 1,
  },
  actionText: {
    color: "white",
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 16,
    padding: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Raleway_700Bold",
  },
});
