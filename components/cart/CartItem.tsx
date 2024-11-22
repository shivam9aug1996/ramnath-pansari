import React, { memo, useRef, useState } from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";

import { staticImage } from "@/app/(private)/(category)/CategoryList/utils";
import { Colors } from "@/constants/Colors";
import { ThemedView } from "../ThemedView";
import { CartItemProps } from "@/types/global";
import { ThemedText } from "../ThemedText";
import CartButton from "./CartButton";
import { Swipeable } from "react-native-gesture-handler";
import AntDesign from "@expo/vector-icons/AntDesign";
import { MaterialIcons } from "@expo/vector-icons";
import Entypo from "@expo/vector-icons/Entypo";

const CartItem = ({ item, order = false }: CartItemProps) => {
  const [itemHeight, setItemHeight] = useState(0);

  console.log("jhgfdfghjkl cart item", item);

  return (
    <>
      <ThemedView
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          setItemHeight(height);
        }}
        style={[styles.container]}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item?.productDetails?.image || staticImage }}
            placeholder={staticImage}
            style={styles.image}
            contentFit="contain"
          />
        </View>
        <View style={styles.detailsContainer}>
          <ThemedText style={styles.productName}>
            {item?.productDetails?.name}
          </ThemedText>
          <ThemedText style={styles.unitPrice}>
            {`Unit price ₹${item?.productDetails?.discountedPrice}`}
          </ThemedText>
          <ThemedText style={styles.totalPrice}>
            {`₹ ${(
              item?.productDetails?.discountedPrice * item?.quantity
            )?.toFixed(2)}`}
          </ThemedText>
        </View>
        {order ? (
          <View style={{ justifyContent: "flex-end", marginRight: 10 }}>
            <ThemedText style={styles.unitPrice}>
              {`${item?.quantity || 0} Quantity`}
            </ThemedText>
          </View>
        ) : (
          <CartButton
            item={item}
            value={item?.quantity || 0}
            itemHeight={itemHeight}
          />
        )}
      </ThemedView>
      {/* </Swipeable> */}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#F1F4F3",
    padding: 20,
    borderRadius: 23,
    flex: 1,
    justifyContent: "flex-start",
    marginBottom: 20,
  },
  imageContainer: {
    flex: 0.35,
  },
  image: {
    width: 50,
    height: 50,
    marginRight: 15,
  },
  detailsContainer: {
    justifyContent: "space-evenly",
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 14,
    fontFamily: "Raleway_700Bold",
    color: Colors.light.darkGreen,
  },
  unitPrice: {
    fontSize: 11,
    fontFamily: "Montserrat_500Medium",
    color: Colors.light.mediumGrey,
    marginVertical: 3,
  },
  totalPrice: {
    fontSize: 20,
    fontFamily: "Montserrat_600SemiBold",
    color: Colors.light.lightGreen,
  },
});

export default memo(CartItem);
