import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors } from "@/constants/Colors";
import ImageDisplay from "./ImageDisplay";
import { getOrderStatusTitle } from "./utils";
import { formatNumber } from "@/utils/utils";

interface OrderItemProps {
  item: any;
  index: number;
}

const OrderItem = ({ item, index }: OrderItemProps) => {
  const status = item?.orderHistory[0]?.status;
  const backgroundColor =
    status === "out_for_delivery"
      ? "#FFF7CD"
      : status === "confirmed"
        ? "#E0F7FA"
        : status === "canceled"
          ? "#F8ECEC"
          : "#EBF4F1";
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

  const imgCount = item?.imgArr?.length >= 3 ? 3 : item?.imgArr?.length || 0;
  const countToShow = item?.totalProductCount - imgCount;

  return (
    <TouchableOpacity
      key={item?._id || index}
      onPress={() => {
        router.navigate(`/(orderDetail)/${item?._id}?prevStatus=${status}`);
      }}
      style={[
        styles.itemContainer,
        {
          backgroundColor: backgroundColor,
        },
      ]}
    >
      <ImageDisplay count={countToShow} images={item?.imgArr || []} />

      <View style={styles.itemContent}>
        <View style={styles.statusWrapper}>
          <View
            style={[
              styles.statusCircle,
              {
                backgroundColor: statusCircleColor,
                borderColor: statusOuterCircleColor,
              },
            ]}
          />
          <Text style={styles.orderStatus}>{getOrderStatusTitle(item)}</Text>
        </View>

        <View style={styles.detailsWrapper}>
          <Text style={styles.productCountText}>
            {`Items: ${item?.totalProductCount}`}
          </Text>
          <Text style={styles.amountText}>{`₹${formatNumber(
            item?.amountPaid
          )}`}</Text>
        </View>
      </View>
      <MaterialIcons
        style={{ paddingLeft: 10 }}
        name="navigate-next"
        size={18}
        color={Colors.light.mediumGrey}
      />
    </TouchableOpacity>
  );
};

export default OrderItem;

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