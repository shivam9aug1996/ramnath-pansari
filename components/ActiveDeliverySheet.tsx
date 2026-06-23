import React, { memo, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import BottomSheet from "@/components/BottomSheet";
import { OrderStatus } from "@/constants/Order";
import { formatNumber } from "@/utils/utils";
import {
  ActiveFloatOrder,
  getOrderStatusLabel,
} from "@/utils/activeOrderFloat";
import DeferredFadeIn from "./DeferredFadeIn";

interface ActiveDeliverySheetProps {
  orders: ActiveFloatOrder[];
  onClose: () => void;
}

function getStatusStyle(status?: string) {
  if (status?.toLowerCase() === OrderStatus.OUT_FOR_DELIVERY) {
    return { text: styles.statusDelivering, row: styles.rowDelivering };
  }
  return { text: styles.statusConfirmed, row: styles.rowConfirmed };
}

function buildOrderMetaText(order: ActiveFloatOrder) {
  const itemCount = order.totalProductCount ?? 0;
  const itemLabel = `${itemCount} item${itemCount !== 1 ? "s" : ""}`;
  if (order.amountPaid == null) {
    return itemLabel;
  }
  return `${itemLabel} · ₹${formatNumber(order.amountPaid)}`;
}

type ActiveDeliveryOrderRowProps = {
  order: ActiveFloatOrder;
  onSelect: (order: ActiveFloatOrder) => void;
};

const ActiveDeliveryOrderRow = memo(function ActiveDeliveryOrderRow({
  order,
  onSelect,
}: ActiveDeliveryOrderRowProps) {
  const handlePress = useCallback(() => {
    onSelect(order);
  }, [onSelect, order]);

  const thumb = order.imgArr?.[0];
  const statusStyle = getStatusStyle(order.orderStatus);
  const orderLabel = order.orderId ?? order._id?.slice(-6);
  const metaText = useMemo(
    () => buildOrderMetaText(order),
    [order.amountPaid, order.totalProductCount],
  );
  const statusLabel = useMemo(
    () => getOrderStatusLabel(order.orderStatus),
    [order.orderStatus],
  );

  return (
    <TouchableOpacity
      style={[styles.row, statusStyle.row]}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      <View style={styles.thumbWrap}>
        {thumb ? (
          <Image
            source={{ uri: thumb }}
            style={styles.thumb}
            contentFit="contain"
          />
        ) : (
          <MaterialCommunityIcons
            name="package-variant"
            size={28}
            color="#F57F17"
          />
        )}
      </View>

      <View style={styles.rowBody}>
        <Text style={styles.orderId} numberOfLines={1}>
          Order #{orderLabel}
        </Text>
        <Text style={styles.meta}>{metaText}</Text>
        <Text style={[styles.status, statusStyle.text]}>{statusLabel}</Text>
      </View>

      <MaterialCommunityIcons
        name="chevron-right"
        size={22}
        color="#F57F17"
      />
    </TouchableOpacity>
  );
});

const ActiveDeliverySheet = memo(function ActiveDeliverySheet({
  orders,
  onClose,
}: ActiveDeliverySheetProps) {
  const handleSelect = useCallback(
    (order: ActiveFloatOrder) => {
      onClose();
      const prevStatus =
        order.orderStatus?.toLowerCase() ?? OrderStatus.CONFIRMED;
      router.navigate(`/(orderDetail)/${order._id}?prevStatus=${prevStatus}`);
    },
    [onClose],
  );

  const deliveringCount = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.orderStatus?.toLowerCase() === OrderStatus.OUT_FOR_DELIVERY,
      ).length,
    [orders],
  );

  const subtitle = useMemo(() => {
    if (deliveringCount > 0) {
      return `${deliveringCount} delivering · ${orders.length - deliveringCount} confirmed`;
    }
    return `${orders.length} order${orders.length > 1 ? "s" : ""} confirmed`;
  }, [deliveringCount, orders.length]);

  return (
    <BottomSheet onClose={onClose} wrapperStyle={styles.sheetWrapper}>
      <View style={styles.header}>
        <Text style={styles.title}>Active orders</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        <DeferredFadeIn delay={100}>
          {orders.map((order) => (
            <ActiveDeliveryOrderRow
              key={order._id}
              order={order}
              onSelect={handleSelect}
            />
          ))}
        </DeferredFadeIn>
      </ScrollView>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  sheetWrapper: {
    height: "100%",
    zIndex: 200,
    elevation: 200,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 18,
    color: "#1a1a1a",
  },
  subtitle: {
    marginTop: 4,
    fontFamily: "Montserrat_500Medium",
    fontSize: 13,
    color: "#6b7280",
  },
  list: {
    maxHeight: 360,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  rowDelivering: {
    backgroundColor: "#FFF7CD",
    borderColor: "#FFE082",
  },
  rowConfirmed: {
    backgroundColor: "#E8F7FA",
    borderColor: "#B3E5FC",
  },
  thumbWrap: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  thumb: {
    width: 44,
    height: 44,
  },
  rowBody: {
    flex: 1,
    marginLeft: 12,
  },
  orderId: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 14,
    color: "#1a1a1a",
  },
  meta: {
    marginTop: 2,
    fontFamily: "Montserrat_500Medium",
    fontSize: 12,
    color: "#6b7280",
  },
  status: {
    marginTop: 4,
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 12,
  },
  statusDelivering: {
    color: "#F57F17",
  },
  statusConfirmed: {
    color: "#00796B",
  },
});

export default ActiveDeliverySheet;
