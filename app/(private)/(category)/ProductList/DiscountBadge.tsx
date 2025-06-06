import { Colors } from "@/constants/Colors";
import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";

const DiscountBadge = memo(({ discount }: { discount: number }) => {
  if (!discount) return null;

  return (
    <View style={styles.discountBadge}>
      <Text style={styles.discountText}>{`${discount}%`}</Text>
    </View>
  );
});

export default DiscountBadge;

const styles = StyleSheet.create({
  discountBadge: {
    position: "absolute",
    backgroundColor: Colors.light.lightGreen,
    zIndex: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    left: 10,
    top: 10,
    borderRadius: 4,
  },
  discountText: {
    color: Colors.light.white,
    fontSize: 12,
    fontFamily: "Montserrat_700Bold",
  },
});
