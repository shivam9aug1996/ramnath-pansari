import { Easing, FlatList, StyleSheet, Text, View } from "react-native";
import React, { memo, useCallback, useMemo } from "react";
import CartPlaceholder from "./CartPlaceholder";
import CartItem from "./CartItem";
import { CartItemProps } from "@/types/global";
import { throttle } from "lodash";
import { useAnimatedStyle, withTiming } from "react-native-reanimated";

const CartList = ({
  cartItemIndex,
  isCartProcessing,
  cartData,
  headerVisible,
}) => {
  console.log("loptr57");
  const renderItem = useCallback(({ item, index }: CartItemProps) => {
    return <CartItem key={item?.productDetails?._id || index} item={item} />;
  }, []);

  let lastOffset = 0;

  const debouncedScroll = useMemo(
    () =>
      throttle((event) => {
        if (event.nativeEvent) {
          const currentOffset = event.nativeEvent.contentOffset.y;

          const contentHeight = event.nativeEvent.contentSize.height; // Total height of the content
          const scrollViewHeight = event.nativeEvent.layoutMeasurement.height; // Height of the visible area

          // if (scrollViewHeight + currentOffset >= contentHeight - 10) {
          //   headerVisible.value = 0;
          //   return;
          // }

          // Show header when scrolling up or at top
          if (currentOffset < 200 || currentOffset < lastOffset) {
            headerVisible.value = 1;
          }
          // Hide header when scrolling down
          else if (currentOffset > lastOffset && currentOffset > 10) {
            headerVisible.value = 0;
          }

          lastOffset = currentOffset;
        }
      }, 200), // 200ms debounce time
    []
  );

  const handleScroll = useCallback(
    (event) => {
      event?.persist();
      debouncedScroll(event);
    },
    [debouncedScroll]
  );

  return (
    <FlatList
      onScroll={handleScroll}
      scrollEventThrottle={32}
      initialNumToRender={4}
      maxToRenderPerBatch={4}
      windowSize={2}
      //disableAutoLayout
      ListHeaderComponent={
        cartItemIndex == -1 && isCartProcessing ? (
          <CartPlaceholder
            wrapperStyle={{ paddingHorizontal: 0, paddingTop: 0 }}
            count={1}
          />
        ) : null
      }
      //extraData={cartData?.cart?.items}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContainer}
      data={cartData?.cart?.items}
      renderItem={renderItem}
      keyExtractor={(item, index) => item?.productDetails?._id || index}
      //ListFooterComponent={{}}
      // estimatedItemSize={101}
    />
  );
};

export default memo(CartList);

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 180,
    paddingTop: 150,
  },
});
