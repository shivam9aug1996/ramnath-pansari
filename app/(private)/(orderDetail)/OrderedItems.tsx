import { FlatList, ScrollView, StyleSheet, Text, View } from "react-native";
import React, { memo } from "react";
import { Colors } from "@/constants/Colors";
import { FlashList } from "@shopify/flash-list";
import { CartItemProps } from "@/types/global";
import CartItem from "@/components/cart/CartItem";

const OrderedItems = ({ itemsOrdered = [] }) => {
  console.log("gfbnm,", itemsOrdered);
  const renderItem = ({ item, index }: CartItemProps) => {
    return (
      <CartItem
        order={true}
        key={item?.productDetails?._id || index}
        item={item}
      />
    );
  };
  return (
    <View style={{ flexDirection: "column" }}>
      <Text style={[styles.heading, { marginTop: 15 }]}>Items</Text>
      <View style={styles.listContainer} />
      {itemsOrdered?.map((item) => {
        return (
          <CartItem
            order={true}
            key={item?.productDetails?._id || index}
            item={item}
          />
        );
      })}
      {/* <ScrollView horizontal scrollEnabled={false}>
        <View style={styles.detailsContainer}>
          <FlatList
            initialNumToRender={4}
            scrollEnabled={false}
            //disableAutoLayout
            extraData={itemsOrdered}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            data={itemsOrdered}
            renderItem={renderItem}
            keyExtractor={(item, index) => item?.productDetails?._id || index}
            //estimatedItemSize={101}
          />
        </View>
      </ScrollView> */}
    </View>
  );
};

export default memo(OrderedItems);

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
