import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { Colors } from "@/constants/Colors";
import ContentLoader, { Rect } from "react-content-loader/native";
import StepOrderTracking from "./StepOrderTracking";
import OrderedItems from "./OrderedItems";
import CartPlaceholder from "@/components/cart/CartPlaceholder";

const renderText = () => {
  return (
    <ContentLoader
      speed={1}
      width={"100%"}
      height={13}
      backgroundColor="#f3f3f3"
      foregroundColor="#e3e3e3"
    >
      <Rect width="100%" y={0} rx={5} ry={5} height="13" />
    </ContentLoader>
  );
};

const renderText2 = () => {
  return (
    <ContentLoader
      speed={1}
      width={"100%"}
      height={45}
      backgroundColor="#f3f3f3"
      foregroundColor="#e3e3e3"
      style={{ marginLeft: 10 }}
    >
      <Rect width="80%" y={0} rx={5} ry={5} height="15" />
      <Rect width="80%" y={25} rx={5} ry={5} height="15" />
    </ContentLoader>
  );
};

const DetailItem = ({
  label,
  backgroundColor,
  textColor,
  fontFamily = "Raleway_600SemiBold",
}: {
  label: string;
  backgroundColor: string;
  textColor: string;
  fontFamily?: string;
}) => {
  return (
    <View style={styles.detailItemContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.valueContainer, { backgroundColor }]}>
        {renderText()}
      </View>
    </View>
  );
};

const OrderDetailPlaceholder = () => {
  return (
    <View>
      <View style={{ flexDirection: "column" }}>
        <Text style={styles.heading}>Order Detail</Text>
        <View style={styles.detailsContainer}>
          <DetailItem
            label="Status"
            //  value={orderStatus}
            backgroundColor="#F4F4F4"
            textColor={Colors.light.darkGrey}
          />
          <DetailItem
            label="Purchase Date"
            // value={convertDate(orderStatusData?.timestamp)}
            backgroundColor="#F4F4F4"
            textColor={Colors.light.mediumGrey}
            fontFamily="Montserrat_500Medium"
          />
        </View>
        <View style={[styles.detailsContainer, { marginTop: 10 }]}>
          <DetailItem
            label="Order ID"
            //value={data?.orderData?.orderId}
            backgroundColor="#F4F4F4"
            textColor={Colors.light.mediumGrey}
            fontFamily="Montserrat_500Medium"
          />
          <View style={{ flex: 1 }}></View>
        </View>
      </View>
      <View style={{ flexDirection: "column" }}>
        <Text style={[styles.heading, { marginTop: 35 }]}>Payment Detail</Text>
        <View style={styles.detailsContainer}>
          <DetailItem
            label="Amount"
            // value={amountPaid}
            backgroundColor="#F4F4F4"
            textColor={Colors.light.mediumGrey}
            fontFamily="Montserrat_500Medium"
          />
          <DetailItem
            label="Payment Mode"
            //value={tData?.method}
            backgroundColor="#F4F4F4"
            textColor={Colors.light.mediumGrey}
          />
        </View>
      </View>

      <Text style={[styles.heading, { marginTop: 35 }]}>Tracking Detail</Text>
      <View
        style={[
          styles.stepContainer,
          {
            backgroundColor: "#F4F4F4",
            padding: 10,
            borderRadius: 23,
            //marginBottom: 9,
            paddingVertical: 10,
            marginTop: 35,
          },
        ]}
      >
        {renderText2()}
      </View>
      <Text style={[styles.heading, { marginTop: 35, marginBottom: 15 }]}>
        Items
      </Text>
      <CartPlaceholder wrapperStyle={{ paddingHorizontal: 0 }} />
    </View>
  );
};

export default OrderDetailPlaceholder;

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
  container: {
    flex: 1,
    padding: 0,
    backgroundColor: "#fff",
  },
  stepContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 0,
  },
  stepIndicatorContainer: {
    width: 20,
    alignItems: "center",
    top: 3,
    left: 20,
  },
  completedStep: {
    width: 5,
    height: 5,
    borderRadius: 6,
    backgroundColor: "#4CAF50", // Green for completed
  },
  currentStep: {
    width: 5,
    height: 5,
    borderRadius: 6,
    // backgroundColor: "#FF9800", // Orange for current
  },
  stepLine: {
    width: 1,
    height: 45,
    backgroundColor: "#4CAF50",
    position: "absolute",
    top: 12,
    left: 9, // Center the line with the dot
    opacity: 0.5,
  },
  stepContent: {
    // marginLeft: 40,
    // left: 30,
  },
  stepStatus: {
    fontSize: 12,
    color: Colors.light.darkGrey,
    fontFamily: "Raleway_700Bold",
    paddingBottom: 3,
    textTransform: "capitalize",
  },
  stepDate: {
    fontSize: 10,
    color: Colors.light.mediumLightGrey,
    fontFamily: "Montserrat_500Medium",
    letterSpacing: 1,
  },
});
