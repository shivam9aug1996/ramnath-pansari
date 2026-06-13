import { StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";

export const PRODUCT_DETAIL_HEADER_HEIGHT = 300;
export const FOOD_BADGE_SIZE_MD = 20;
export const PRODUCT_NAME_MIN_HEIGHT = 52;
export const CART_BUTTON_SPACER_HEIGHT = 56;

export const productDetailContentStyles = StyleSheet.create({
  textContainer: {
    paddingHorizontal: 10,
    marginTop: 10,
    paddingBottom: CART_BUTTON_SPACER_HEIGHT,
    position: "relative",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 6,
  },
  productName: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Montserrat_700Bold",
  },
  productPrice: {
    fontSize: 18,
    fontFamily: "Montserrat_600SemiBold",
    color: Colors.light.lightGreen,
    marginTop: 5,
  },
  originalPrice: {
    textDecorationLine: "line-through",
    textDecorationColor: Colors.light.darkGrey,
    fontSize: 16,
    color: Colors.light.darkGrey,
  },
  size: {
    fontSize: 14,
    fontFamily: "Montserrat_600SemiBold",
    color: Colors.light.darkGrey,
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: "capitalize",
  },
  discountTag: {
    backgroundColor: Colors.light.lightGreen,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginVertical: 5,
  },
  discountText: {
    color: Colors.light.white,
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 12,
  },
  infoSectionsContainer: {
    paddingHorizontal: 10,
    marginTop: 8,
    gap: 20,
  },
  infoSection: {
    backgroundColor: Colors.light.softGrey_2,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  infoSectionTitle: {
    fontSize: 16,
    fontFamily: "Montserrat_700Bold",
    color: Colors.light.defaultText,
    marginBottom: 12,
  },
  infoSectionBody: {
    gap: 10,
  },
});
