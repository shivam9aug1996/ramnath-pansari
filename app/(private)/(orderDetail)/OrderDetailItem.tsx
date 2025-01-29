import { memo } from "react";
import { getStatusStyle } from "./utils";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { getOrderStatusTitle1 } from "../(order)/utils";

const OrderDetailItem = ({
  label,
  value,
  icon,
  isStatus = false
}: {
  label: string;
  value: string;
  icon: string;
  isStatus?: boolean;
}) => {
  const statusStyle = getStatusStyle(value);

  return (
    <View style={[
      styles.orderItemCard,
      isStatus && { width: '100%' }
    ]}>
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
        <Text style={styles.orderItemValue}>{value}</Text>
      )}
    </View>
  );
};

export default memo(OrderDetailItem);
const styles = StyleSheet.create({
  orderDetailSection: {
    marginTop: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  heading: {
    fontFamily: "Raleway_700Bold",
    fontSize: 20,
    color: Colors.light.darkGreen,
  },
  orderDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  orderItemCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    flex: 1,
    minWidth: '47%',
  },
  orderItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.mediumGrey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderItemLabel: {
    fontFamily: "Raleway_600SemiBold",
    fontSize: 13,
    color: Colors.light.mediumGrey,
    flex: 1
  },
  orderItemValue: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 15,
    color: Colors.light.darkGrey,
    marginTop: 4,
  },
  statusContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  statusValue: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 14,
  },
});