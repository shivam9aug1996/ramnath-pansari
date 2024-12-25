import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  Alert,
  Pressable,
} from "react-native";
import React, {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
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
// import NotFound from "../(result)/NotFound";
import AddressPlaceholder from "./AddressPlaceholder";
// import TryAgain from "../(category)/CategoryList/TryAgain";

import * as Linking from "expo-linking";
import usePayment from "./usePayment";
// import Button from "@/components/Button";
import LottieSuccess from "./LottieSuccess";
import { usePreloadAssets } from "@/hooks/usePreloadAssets";
import CustomSuspense from "@/components/CustomSuspense";
import Modal from "@/components/Modal";
import BottomSheet from "@/components/BottomSheet";
import CodOnline from "./CodOnline";
import { formatNumber } from "@/utils/utils";
import { Platform } from "react-native";
// import PayBottomSheet from "./PayBottomSheet";
const PayBottomSheet = lazy(() => import("./PayBottomSheet"));
const TryAgain = lazy(() => import("../(category)/CategoryList/TryAgain"));
const NotFound = lazy(() => import("../(result)/NotFound"));
const Button = lazy(() => import("@/components/Button"));

const addressList = () => {
  const params = useLocalSearchParams();
  const cartButtonProductId = useSelector(
    (state: RootState) => state.cart.cartButtonProductId
  );
  const totalAmount = useSelector((state: RootState) => state.cart.totalAmount);
  let totalAmountInNumber = useSelector(
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
  const [isPayModal, setIsPayModal] = useState(false);

  const userId = useSelector((state: RootState) => state?.auth?.userData?._id);
  const { isLoading, data, error, isFetching, isSuccess, refetch } =
    useFetchAddressQuery({ userId }, { skip: !userId });
  const listRef = useRef<FlatList>(null);
  const { handleOnClick, isPaymentProcessing, isRazorpayOpened, handleCod } =
    usePayment();
  useEffect(() => {
    if (isFetching) {
      scrollToTop(listRef);
    }
  }, [isFetching]);

  const isButtonLoading =
    cartButtonProductId?.length != 0 || isPaymentProcessing;

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
      disabled={isButtonLoading}
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

  return (
    <>
      <ScreenSafeWrapper>
        <CustomSuspense>
          <View
            style={{
              flexDirection: "row",
              marginTop: 37,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", paddingRight: 20 }}>
              <ThemedText
                style={[
                  styles.headerTitle,
                  { fontSize: checkoutFlow ? 18 : 20 },
                ]}
              >{`${
                checkoutFlow
                  ? data?.length == 0
                    ? "Add Delivery Address"
                    : "Choose Delivery Address"
                  : "Saved Addresses"
              }`}</ThemedText>
            </View>
            <TouchableOpacity
              disabled={isButtonLoading}
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
            <Suspense fallback={null}>
              <TryAgain refetch={refetchMe} />
            </Suspense>
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
            <Suspense fallback={null}>
              <NotFound
                title={"Where Should We Deliver?"}
                subtitle={"Add an address to get started with your orders."}
                style={{ flex: 0.4, marginHorizontal: 50 }}
              />
            </Suspense>
          ) : (
            <Suspense fallback={null}>
              <NotFound
                title={"No Saved Addresses"}
                subtitle={
                  "Add an address to quickly fill in your details at checkout."
                }
                style={{ flex: 0.4, marginHorizontal: 50 }}
              />
            </Suspense>
          )}
          {/* <Modal /> */}

          {checkoutFlow && data?.length ? (
            <Suspense fallback={null}>
              <Button
                isLoading={isButtonLoading}
                title={`Pay ₹${formatNumber(totalAmountInNumber)}`}
                onPress={() => {
                  const addressData = data?.find((item) => {
                    return item?._id == selectedAddressId;
                  });
                  console.log("kjhyt567890-", addressData, totalAmountInNumber);
                  setIsPayModal(true);

                  //handleOnClick(totalAmountInNumber, addressData);
                }}
                textStyle={{ fontFamily: "Montserrat_600SemiBold" }}
                wrapperStyle={{
                  paddingBottom: Platform.OS == "android" ? 20 : 0,
                }}
              />
            </Suspense>
          ) : null}
        </CustomSuspense>
      </ScreenSafeWrapper>
      {isPayModal && (
        <Suspense fallback={null}>
          <PayBottomSheet
            setIsPayModal={setIsPayModal}
            data={data}
            isButtonLoading={isButtonLoading}
            totalAmountInNumber={totalAmountInNumber}
            selectedAddressId={selectedAddressId}
            handleOnClick={handleOnClick}
            handleCod={handleCod}
          />
        </Suspense>
      )}
    </>
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
  loadingOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: 9999,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText1: {
    fontSize: 30,
    color: "white",
  },
});
