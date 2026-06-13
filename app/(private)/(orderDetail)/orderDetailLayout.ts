import { StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";

/** Shared order-detail layout — placeholder and real cards use the same rules on any screen width. */
export const ORDER_DETAIL_GRID_GAP = 12;
export const ORDER_ITEM_MIN_WIDTH = "47%";
export const ORDER_VALUE_LINE_HEIGHT = 22;
export const ORDER_VALUE_TWO_LINE_MIN_HEIGHT = 44;
export const ORDER_VALUE_ONE_LINE_MIN_HEIGHT = 22;
export const ORDER_SECTION_SPACING = 35;
export const ORDER_PAYMENT_IN_SHEET_SPACING = 28;
export const ORDER_TRACKING_HEADING_MARGIN_BOTTOM = 20;

export const orderDetailGridStyles = StyleSheet.create({
  orderDetailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: ORDER_DETAIL_GRID_GAP,
  },
  orderItemCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    flex: 1,
    minWidth: ORDER_ITEM_MIN_WIDTH,
  },
  fullWidthCard: {
    width: "100%",
    flex: undefined,
    minWidth: "100%",
  },
  orderItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.mediumGrey,
    justifyContent: "center",
    alignItems: "center",
  },
  orderItemValue: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 15,
    color: Colors.light.darkGrey,
    marginTop: 4,
    lineHeight: ORDER_VALUE_LINE_HEIGHT,
    minHeight: ORDER_VALUE_TWO_LINE_MIN_HEIGHT,
  },
  orderItemValueFull: {
    minHeight: ORDER_VALUE_ONE_LINE_MIN_HEIGHT,
  },
  statusContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  orderItemLabel: {
    fontFamily: "Raleway_600SemiBold",
    fontSize: 13,
    color: Colors.light.mediumGrey,
    flex: 1,
  },
  statusValue: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 14,
  },
  statusContainerSkeleton: {
    backgroundColor: "#F5F5F5",
  },
  valueSkeletonTwoLine: {
    marginTop: 4,
    minHeight: ORDER_VALUE_TWO_LINE_MIN_HEIGHT,
    gap: 9,
    justifyContent: "center",
  },
  valueSkeletonOneLine: {
    marginTop: 4,
    minHeight: ORDER_VALUE_ONE_LINE_MIN_HEIGHT,
    justifyContent: "center",
  },
});
