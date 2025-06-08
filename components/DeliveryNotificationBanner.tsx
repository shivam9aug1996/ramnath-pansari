import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { Colors } from "@/constants/Colors";
import { onValue, ref } from "firebase/database";
import { database } from "@/firebase";
import { useDispatch } from "react-redux";
import { orderApi } from "@/redux/features/orderSlice";
import { useSelector } from "react-redux";
import { RootState } from "@/types/global";
import { showToast } from "@/utils/utils";
interface DeliveryNotificationBannerProps {
  orderId: string;
  onClose: () => void;
  _id: string;
}

const DeliveryNotificationBanner: React.FC<DeliveryNotificationBannerProps> = ({
  orderId,
  onClose,
  _id,
}) => {
  const userId = useSelector((state: RootState) => state?.auth?.userData?._id);
  const dispatch = useDispatch();
  const pathname = usePathname();
 // console.log("u6543456=", pathname);
  useEffect(() => {
    if (!userId) return;
    const orderStatusRef = ref(database, `orders/${userId}/order/status`);

    const unsubscribe = onValue(orderStatusRef, (snapshot) => {
      const data = snapshot.val();
      if (data?.trigger) {
        if (data?.status === "out_for_delivery") {
          showToast({
            type: "info",
            text2: "Your order is out for delivery!",
          });
        } else if (data?.status === "delivered") {
          showToast({
            type: "success",
            text2: "Your order is delivered!",
          });
        } else if (data?.status === "canceled") {
          showToast({
            type: "error",
            text2: "Your order is cancelled!",
          });
        }

        dispatch(
          orderApi.util.invalidateTags([
            {
              type: "detailOrder",
              id: `${data?._id}-${userId}`,
            },
          ])
        );

        dispatch(
          orderApi.util.invalidateTags([{ type: "orderList", id: `${userId}` }])
        );
        dispatch(
          orderApi.util.invalidateTags([
            {
              type: "detailOrder",
              id: `${data?._id}-${userId}`,
            },
          ])
        );
      }
     // console.log("data4567890", data);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return null
  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom:
            pathname === "/home" || pathname === "/account"
              ? 50
              : pathname === "/cartScreen"
              ? 16
              : 16,
        },
      ]}
    >
      <View style={styles.content}>
        <MaterialCommunityIcons
          name="truck-delivery"
          size={24}
          color="#F57F17"
        />
        <Text style={styles.text}>Your order is out for delivery!</Text>
        <TouchableOpacity
          style={styles.trackButton}
          onPress={() => {
            router.navigate(`/(orderDetail)/${_id}`);
          }}
        >
          <Text style={styles.trackButtonText}>Track Order</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <MaterialCommunityIcons name="close" size={20} color="#F57F17" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // position: 'absolute',
    // top: 0,
    // left: 0,
    // right: 0,
    backgroundColor: "#FFF7CD",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#FFE082",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    marginLeft: 12,
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 14,
    color: "#F57F17",
    flex: 1,
  },
  trackButton: {
    backgroundColor: "#F57F17",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 12,
  },
  trackButtonText: {
    color: "#FFFFFF",
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 12,
  },
  closeButton: {
    padding: 4,
  },
});

export default DeliveryNotificationBanner;
