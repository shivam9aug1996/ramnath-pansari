import { ScrollView, StyleSheet, Text, View } from "react-native";
import React from "react";
import { useLocalSearchParams } from "expo-router";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import { useFetchOrderDetailQuery } from "@/redux/features/orderSlice";
import { useSelector } from "react-redux";
import { RootState } from "@/types/global";
import { Colors } from "@/constants/Colors";
import StepOrderTracking from "./StepOrderTracking";
import { convertDate, getOrderStatusTitle1 } from "../(order)/utils";
import { OrderStatus } from "../(order)/mock";
import OrderedItems from "./OrderedItems";

const OrderDetail = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useSelector((state: RootState) => state?.auth?.userData?._id);
  const { data } = useFetchOrderDetailQuery(
    { orderId: id, userId },
    { skip: !id }
  );
  const itemsOrdered = data?.orderData?.cartData?.cart?.items || [];

  console.log("Order Data:", JSON.stringify(data));

  // Example tracking data (replace with actual data from API if available)
  const trackingData = data?.orderData?.orderHistory;
  // const trackingData = [
  //   {
  //     status: OrderStatus.CANCELED,
  //     timestamp: "2024-11-19T14:42:40.263Z",
  //   },
  //   {
  //     status: OrderStatus.OUT_FOR_DELIVERY,
  //     timestamp: "2024-11-19T14:42:40.263Z",
  //   },
  //   {
  //     status: OrderStatus.CONFIRMED,
  //     timestamp: "2024-11-19T14:42:40.263Z",
  //   },
  // ];
  console.log("uytrfghjkl", trackingData);

  const amountPaid = `₹ ${data?.orderData?.amountPaid}`;
  const orderStatus = data?.orderData?.orderStatus;
  const tData = data?.orderData?.transactionData;
  let orderHistory = data?.orderData?.orderHistory;
  console.log("ytrdsdfghjk", orderHistory);
  let orderStatusData = orderHistory?.[orderHistory?.length - 1];
  const isOrderConfirmed = orderStatus?.toLowerCase() === OrderStatus.CONFIRMED;
  const isOrderCancelled = orderStatus?.toLowerCase() === OrderStatus.CANCELED;
  const isOrderOut =
    orderStatus?.toLowerCase() === OrderStatus.OUT_FOR_DELIVERY;
  const isOrderDelivered = orderStatus?.toLowerCase() === OrderStatus.DELIVERED;
  const status = orderStatus?.toLowerCase();
  const backgroundColor =
    status === "out_for_delivery"
      ? "#FFF7CD"
      : status === "confirmed"
      ? "#E0F7FA"
      : status === "canceled"
      ? "#F8ECEC"
      : "#EBF4F1";
  return (
    <ScreenSafeWrapper showCartIcon>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "column" }}>
          <Text style={styles.heading}>Order Detail</Text>
          <View style={styles.detailsContainer}>
            <DetailItem
              label="Status"
              value={orderStatus}
              // backgroundColor={backgroundColor}
              backgroundColor={backgroundColor}
              textColor={Colors.light.darkGrey}
            />
            <DetailItem
              label="Purchase Date"
              value={convertDate(orderStatusData?.timestamp)}
              backgroundColor="#F4F4F4"
              textColor={Colors.light.mediumGrey}
              fontFamily="Montserrat_500Medium"
            />
          </View>
          <View style={[styles.detailsContainer, { marginTop: 10 }]}>
            <DetailItem
              label="Order ID"
              value="7897-443200-5135"
              backgroundColor="#F4F4F4"
              textColor={Colors.light.mediumGrey}
              fontFamily="Montserrat_500Medium"
            />
            <View style={{ flex: 1 }}></View>
          </View>
        </View>
        <View style={{ flexDirection: "column" }}>
          <Text style={[styles.heading, { marginTop: 35 }]}>
            Payment Detail
          </Text>
          <View style={styles.detailsContainer}>
            <DetailItem
              label="Amount"
              value={amountPaid}
              backgroundColor="#F4F4F4"
              textColor={Colors.light.mediumGrey}
              fontFamily="Montserrat_500Medium"
            />
            <DetailItem
              label="Payment Mode"
              value={tData?.method}
              backgroundColor="#F4F4F4"
              textColor={Colors.light.mediumGrey}
            />
          </View>
        </View>

        <Text style={[styles.heading, { marginTop: 35 }]}>Tracking Detail</Text>
        <StepOrderTracking trackingData={trackingData} />
        <OrderedItems itemsOrdered={itemsOrdered} />
      </ScrollView>
    </ScreenSafeWrapper>
  );
};

const DetailItem = ({
  label,
  value,
  backgroundColor,
  textColor,
  fontFamily = "Raleway_600SemiBold",
}: {
  label: string;
  value: string;
  backgroundColor: string;
  textColor: string;
  fontFamily?: string;
}) => {
  const status = value;
  const statusCircleColor =
    status === "out_for_delivery"
      ? "#FFCC00" // Yellow for out for delivery
      : status === "confirmed"
      ? "#00B0FF" // Blue for confirmed
      : status === "canceled"
      ? "#FF6B6B" // Red for canceled
      : "#4CAF50"; // Green for delivered
  const statusOuterCircleColor =
    status === "out_for_delivery"
      ? "#FFF0BA" // Lighter yellow for outer circle
      : status === "confirmed"
      ? "#B3E5FC" // Lighter blue for outer circle
      : status === "canceled"
      ? "#FAD4D4" // Lighter red for outer circle
      : "#C8E6C9";
  return (
    <View style={styles.detailItemContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.valueContainer, { backgroundColor }]}>
        {label == "Status" && (
          <View
            style={[
              styles.statusCircle,
              {
                backgroundColor: statusCircleColor,
                borderColor: statusOuterCircleColor,
              },
            ]}
          />
        )}
        <Text style={[styles.valueText, { color: textColor, fontFamily }]}>
          {getOrderStatusTitle1(value)}
        </Text>
      </View>
    </View>
  );
};

export default OrderDetail;

const styles = StyleSheet.create({
  heading: {
    fontFamily: "Raleway_700Bold",
    fontSize: 20,
    color: Colors.light.darkGreen,
    marginTop: 20,
  },
  detailsContainer: {
    flexDirection: "row",
    gap: 15,
    marginTop: 20,
  },
  detailItemContainer: {
    flex: 1,
    flexDirection: "column",
    gap: 5,
  },
  label: {
    fontFamily: "Raleway_600SemiBold",
    fontSize: 12,
    color: Colors.light.darkGrey,
    marginLeft: 9,
  },
  valueContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 13,
    flexDirection: "row",
  },
  valueText: {
    fontFamily: "Raleway_600SemiBold",
    fontSize: 10,
    textTransform: "capitalize",
  },
  timelineContainer: {
    flexDirection: "column",
    marginLeft: 20,
    marginTop: 10,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingLeft: 10,
  },
  timelinePointContainer: {
    position: "relative",
    alignItems: "center",
    width: 20,
  },
  timelinePoint: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timelineLine: {
    position: "absolute",
    top: 12,
    width: 2,
    height: 40,
    backgroundColor: Colors.light.mediumGrey,
  },
  timelineContent: {
    marginLeft: 15,
  },
  timelineStatus: {
    fontFamily: "Raleway_600SemiBold",
    fontSize: 14,
  },
  timelineDate: {
    fontFamily: "Raleway_400Regular",
    fontSize: 12,
    color: Colors.light.mediumGrey,
  },
  statusCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 3,
  },
});
