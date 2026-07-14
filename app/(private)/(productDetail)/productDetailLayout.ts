import { StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";

export const PRODUCT_DETAIL_HEADER_HEIGHT = 300;
export const FOOD_BADGE_SIZE_MD = 20;
export const PRODUCT_NAME_MIN_HEIGHT = 52;
export const CART_BUTTON_SPACER_HEIGHT = 56;
export const CART_BUTTON_HEIGHT = 50;
export const CART_BUTTON_RADIUS = 12;
/** Extra space below scroll content, above GoToCart chrome */
export const PRODUCT_DETAIL_SCROLL_PADDING_BOTTOM = 24;

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
  outOfStockMutedText: {
    opacity: 0.55,
  },
  outOfStockPrice: {
    color: Colors.light.darkGrey,
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
  /** Matches detail CartButton idle bar slot while cart / body loads */
  cartButtonLoaderWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: CART_BUTTON_HEIGHT,
  },
  cartButtonLoaderBar: {
    height: CART_BUTTON_HEIGHT,
    borderRadius: CART_BUTTON_RADIUS,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: Colors.light.softGreen,
    borderWidth: 1,
    borderColor: "rgba(38, 173, 113, 0.25)",
  },
});
