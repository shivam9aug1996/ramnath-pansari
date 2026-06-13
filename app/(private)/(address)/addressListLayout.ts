import { StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";

/** Shared address-list layout — image column uses flex; text column fills remaining width. */
export const ADDRESS_MAP_IMAGE_SIZE = 100;
export const ADDRESS_LIST_MARGIN_TOP = 20;
export const ADDRESS_LIST_PADDING_VERTICAL = 10;
export const ADDRESS_CARD_MARGIN_BOTTOM = 18;
export const ADDRESS_CARD_PADDING_RIGHT = 40;
export const ADDRESS_IMAGE_FLEX = 0.5;
export const ADDRESS_SKELETON_COUNT = 3;

export const addressCardStyles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 25,
    marginBottom: ADDRESS_CARD_MARGIN_BOTTOM,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: ADDRESS_CARD_PADDING_RIGHT,
    shadowColor: "#2A2A2A",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  imageContainer: {
    flex: ADDRESS_IMAGE_FLEX,
    marginRight: 28,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  image: {
    borderRadius: 20,
    minHeight: ADDRESS_MAP_IMAGE_SIZE,
    minWidth: ADDRESS_MAP_IMAGE_SIZE,
    backgroundColor: Colors.light.softGrey_1,
  },
  textContainer: {
    flex: 1,
    paddingVertical: 10,
  },
  separator: {
    backgroundColor: Colors.light.gradientGreen_2,
    height: 2,
    marginVertical: 8,
    opacity: 0.2,
    width: "100%",
    borderRadius: 1,
  },
  addressLines: {
    gap: 5,
    minHeight: 36,
    paddingBottom: 8,
  },
});
