import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { Colors } from "@/constants/Colors";
import { FlashList } from "@shopify/flash-list";
import { CartItemProps } from "@/types/global";
import CartItem from "@/components/cart/CartItem";

const OrderedItems = ({ itemsOrdered = [] }) => {
  console.log("gfbnm,", itemsOrdered);
  const renderItem = ({ item }: CartItemProps) => {
    return (
      <CartItem order={true} key={item?.productDetails?._id} item={item} />
    );
  };
  return (
    <View style={{ flexDirection: "column" }}>
      <Text style={[styles.heading, { marginTop: 15 }]}>Items</Text>
      <View style={styles.detailsContainer}>
        <FlashList
          extraData={itemsOrdered}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          data={itemsOrdered}
          renderItem={renderItem}
          keyExtractor={(item, index) => item?.productDetails?._id || index}
          estimatedItemSize={101}
        />
      </View>
    </View>
  );
};

export default OrderedItems;

const styles = StyleSheet.create({
  heading: {
    fontFamily: "Raleway_700Bold",
    fontSize: 20,
    color: Colors.light.darkGreen,
    marginTop: 20,
  },
  detailsContainer: {
    flexDirection: "row",
    gap: 15,
    marginTop: 20,
  },
  listContainer: {
    paddingBottom: 20,
    paddingTop: 5,
  },
});
