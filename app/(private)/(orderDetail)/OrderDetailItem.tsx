import { memo } from "react";
import { getStatusStyle } from "./utils";
import { Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getOrderStatusTitle1 } from "../(order)/utils";
import { orderDetailGridStyles } from "./orderDetailLayout";

const styles = orderDetailGridStyles;

const OrderDetailItem = ({
  label,
  value,
  icon,
  isStatus = false,
  fullWidth = false,
}: {
  label: string;
  value: string;
  icon: string;
  isStatus?: boolean;
  fullWidth?: boolean;
}) => {
  const statusStyle = getStatusStyle(value);

  return (
    <View
      style={[
        styles.orderItemCard,
        fullWidth && styles.fullWidthCard,
      ]}
    >
      <View style={styles.orderItemHeader}>
        <View style={[
          styles.iconContainer,
          isStatus && { backgroundColor: statusStyle.iconColor }
        ]}>
          <MaterialCommunityIcons
            name={isStatus ? statusStyle.icon : icon}
            size={18}
            color="#fff"
          />
        </View>
        <Text style={styles.orderItemLabel}>{label}</Text>
      </View>

      {isStatus ? (
        <View style={[
          styles.statusContainer,
          { backgroundColor: statusStyle.backgroundColor }
        ]}>
          <Text style={[
            styles.statusValue,
            { color: statusStyle.textColor }
          ]}>
            {getOrderStatusTitle1(value)}
          </Text>
        </View>
      ) : (
        <Text style={[styles.orderItemValue, fullWidth && styles.orderItemValueFull]}>
          {value}
        </Text>
      )}
    </View>
  );
};

export default memo(OrderDetailItem);