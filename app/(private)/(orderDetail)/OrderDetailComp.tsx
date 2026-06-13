import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import React, { memo, useEffect } from "react";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import {
  orderApi,
  useFetchOrderDetailQuery,
} from "@/redux/features/orderSlice";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/types/global";
import { Colors } from "@/constants/Colors";
import StepOrderTracking from "./StepOrderTracking";
import { convertDate } from "../(order)/utils";
import { OrderStatus } from "../(order)/mock";
import OrderedItems from "./OrderedItems";
import { OrderDetailBodySkeleton } from "./OrderDetailPlaceholder";
import { formatNumber } from "@/utils/utils";
import { calculateSavingsAndFreebies } from "./utils";
import SavingsAndFreebies from "./SavingsAndFreebies";
import PaymentDetailItem from "./PaymentDetailItem";
import OrderPaymentBreakdown from "./OrderPaymentBreakdown";
import {
  calculateTotalAmount,
  calculateTotalAmountMrp,
} from "@/components/cart/utils";
import OrderDetailItem from "./OrderDetailItem";
import DeferredFadeIn from "@/components/DeferredFadeIn";
import OrderLottie from "@/components/OrderLottie";
import OrderLiveTrackingScroll from "./OrderLiveTrackingScroll";
import AddressItem from "./AddressItem";

type OrderDetailBodyProps = {
  orderStatus: string;
  orderStatusData?: { timestamp?: string };
  orderId: string;
  cartItems: unknown[];
  amountPaid: string;
  status: string;
  tData?: { method?: string };
  productDiscount: number;
  freebies: ReturnType<typeof calculateSavingsAndFreebies>["freebies"];
  subtotal?: number;
  deliveryFee?: number;
  addressData: unknown;
  trackingData: unknown;
  itemsOrdered: unknown[];
  inSheet?: boolean;
};

const OrderDetailBody = ({
  orderStatus,
  orderStatusData,
  orderId,
  cartItems,
  amountPaid,
  status,
  tData,
  productDiscount,
  freebies,
  subtotal,
  deliveryFee,
  addressData,
  trackingData,
  itemsOrdered,
  inSheet = false,
}: OrderDetailBodyProps) => (
  <>
    <View style={[styles.orderDetailSection, inSheet && styles.sectionInSheet]}>
      <View style={styles.sectionHeader}>
        <Text style={styles.heading}>Order Detail</Text>
      </View>

      <View style={styles.orderDetailsGrid}>
        <OrderDetailItem
          label="Status"
          value={orderStatus}
          icon="checkbox-marked-circle-outline"
          isStatus={true}
        />
        <OrderDetailItem
          label="Purchase Date"
          value={convertDate(orderStatusData?.timestamp)}
          icon="calendar"
        />
        <OrderDetailItem
          label="Order ID"
          value={orderId}
          icon="pound"
          fullWidth
        />
      </View>
    </View>

    <View style={[styles.paymentSection, inSheet && styles.paymentInSheet]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.heading, { color: Colors.light.darkGrey }]}>
          Payment Detail
        </Text>
      </View>

      <View style={styles.paymentCard}>
        <OrderPaymentBreakdown
          cartItems={cartItems as never}
          subtotal={subtotal}
          deliveryFee={deliveryFee}
        />
        <View style={styles.divider} />
        <PaymentDetailItem
          label={
            tData?.method === "COD" && status !== "delivered"
              ? "Amount to be paid"
              : "Amount Paid"
          }
          value={amountPaid}
          icon="cash-multiple"
        />
        <View style={styles.divider} />
        <PaymentDetailItem
          label="Payment Mode"
          value={
            tData?.method === "COD" && status !== "delivered"
              ? "Cash on Delivery"
              : tData?.method ?? ""
          }
          icon="credit-card-outline"
        />
      </View>
    </View>

    {(productDiscount > 0 || freebies.length > 0) && (
      <SavingsAndFreebies
        regularSavings={productDiscount}
        freebies={freebies}
      />
    )}

    <View style={styles.addressSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.heading}>Address Detail</Text>
      </View>

      <AddressItem addressData={addressData as never} />
    </View>

    <Text style={[styles.heading, styles.trackingHeading]}>
      Tracking Detail
    </Text>

    <StepOrderTracking trackingData={trackingData as never} />

    <DeferredFadeIn delay={inSheet ? 400 : 1000}>
      <OrderedItems itemsOrdered={itemsOrdered as never} />
    </DeferredFadeIn>
  </>
);

const OrderDetailComp = ({
  id,
  prevStatus,
}: {
  id: string;
  prevStatus?: string;
}) => {
  const userId = useSelector((state: RootState) => state?.auth?.userData?._id);
  const { data, isFetching, isSuccess } = useFetchOrderDetailQuery(
    { orderId: id, userId },
    { skip: !id },
  );
  const dispatch = useDispatch();
  const itemsOrdered = data?.orderData?.cartData?.cart?.items || [];
  const trackingData = data?.orderData?.orderHistory;
  const amountPaid = `₹ ${formatNumber(data?.orderData?.amountPaid)}`;
  const orderStatus = data?.orderData?.orderStatus ?? prevStatus ?? "";
  const tData = data?.orderData?.transactionData;
  const orderHistory = data?.orderData?.orderHistory;
  const orderStatusData = orderHistory?.[orderHistory?.length - 1];
  const statusHint = orderStatus.toLowerCase();
  const expectsLiveMap = statusHint === OrderStatus.OUT_FOR_DELIVERY;
  const status = statusHint;
  const cartItems = data?.orderData?.cartData?.cart?.items || [];
  const { freebies } = calculateSavingsAndFreebies(cartItems);
  const orderSubtotal =
    data?.orderData?.subtotal ?? calculateTotalAmount(cartItems);
  const productDiscount =
    calculateTotalAmountMrp(cartItems) - orderSubtotal;

  useEffect(() => {
    if (
      prevStatus !== orderStatus &&
      isSuccess &&
      data?.orderData?.cartData?.cart
    ) {
      dispatch(
        orderApi.util.invalidateTags([{ type: "orderList", id: userId }]),
      );
    }
  }, [prevStatus, orderStatus, isSuccess, data, userId, dispatch]);

  const bodyProps = {
    orderStatus,
    orderStatusData,
    orderId: data?.orderData?.orderId ?? id,
    cartItems,
    amountPaid,
    status,
    tData,
    productDiscount,
    freebies,
    subtotal: data?.orderData?.subtotal,
    deliveryFee: data?.orderData?.deliveryFee,
    addressData: data?.orderData?.addressData,
    trackingData,
    itemsOrdered,
  };

  const useFullBleedWrapper = expectsLiveMap;

  return (
    <ScreenSafeWrapper
      showCartIcon
      wrapperStyle={useFullBleedWrapper ? styles.wrapperFullBleed : undefined}
      headerStyle={useFullBleedWrapper ? styles.headerPadded : undefined}
    >
      <OrderLottie />
      <DeferredFadeIn delay={100} style={{ flex: 1 }}>
        {expectsLiveMap ? (
          <OrderLiveTrackingScroll orderId={id}>
            {isFetching ? (
              <OrderDetailBodySkeleton inSheet />
            ) : (
              <OrderDetailBody {...bodyProps} inSheet />
            )}
          </OrderLiveTrackingScroll>
        ) : (
          <ScrollView
            bounces={Platform.OS === "android" ? false : true}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.paddedScrollContent}
          >
            {isFetching ? (
              <OrderDetailBodySkeleton />
            ) : (
              <OrderDetailBody {...bodyProps} />
            )}
          </ScrollView>
        )}
      </DeferredFadeIn>
    </ScreenSafeWrapper>
  );
};

export default memo(OrderDetailComp);

const styles = StyleSheet.create({
  wrapperFullBleed: {
    paddingHorizontal: 0,
  },
  headerPadded: {
    paddingHorizontal: 20,
  },
  paddedScrollContent: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 16,
  },
  orderDetailSection: {},
  sectionInSheet: {
    marginTop: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  heading: {
    fontFamily: "Raleway_700Bold",
    fontSize: 20,
    color: Colors.light.darkGrey,
  },
  orderDetailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  paymentSection: {
    marginTop: 35,
  },
  paymentInSheet: {
    marginTop: 28,
  },
  addressSection: {
    marginTop: 35,
  },
  trackingHeading: {
    marginTop: 35,
    marginBottom: 20,
  },
  paymentCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
});
