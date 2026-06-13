import { FlatList, Platform, StyleSheet, View } from "react-native";
import React from "react";
import ContentLoader, { Rect } from "react-content-loader/native";
import {
  ADDRESS_LIST_MARGIN_TOP,
  ADDRESS_LIST_PADDING_VERTICAL,
  ADDRESS_SKELETON_COUNT,
  addressCardStyles,
} from "./addressListLayout";

const cardStyles = addressCardStyles;

const LoaderBlock = ({
  width = "100%",
  height = 13,
}: {
  width?: number | string;
  height?: number;
}) => (
  <ContentLoader
    speed={1}
    width={width}
    height={height}
    backgroundColor="#f3f3f3"
    foregroundColor="#e3e3e3"
  >
    <Rect width={width} y={0} rx={5} ry={5} height={height} />
  </ContentLoader>
);

const AddressItemSkeleton = () => (
  <View style={cardStyles.card}>
    <View style={[styles.iconSkeleton, styles.iconSkeletonTop]} />
    <View style={[styles.iconSkeleton, styles.iconSkeletonBottom]} />

    <View style={cardStyles.imageContainer}>
      <View style={cardStyles.image} />
    </View>

    <View style={cardStyles.textContainer}>
      <LoaderBlock width="70%" height={16} />
      <View style={cardStyles.separator} />
      <View style={cardStyles.addressLines}>
        <LoaderBlock width="95%" height={13} />
        <LoaderBlock width="85%" height={13} />
      </View>
      <LoaderBlock width="55%" height={13} />
    </View>
  </View>
);

const AddressPlaceholder = () => {
  return (
    <View style={styles.container}>
      <FlatList
        bounces={Platform.OS === "android" ? false : true}
        data={Array.from({ length: ADDRESS_SKELETON_COUNT }, (_, index) => ({
          _id: String(index + 1),
        }))}
        keyExtractor={(item) => item._id}
        renderItem={() => <AddressItemSkeleton />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        style={styles.list}
        scrollEnabled={false}
      />
    </View>
  );
};

export default AddressPlaceholder;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    marginTop: ADDRESS_LIST_MARGIN_TOP,
  },
  listContainer: {
    paddingVertical: ADDRESS_LIST_PADDING_VERTICAL,
  },
  iconSkeleton: {
    position: "absolute",
    right: 5,
    width: 36,
    height: 36,
    borderRadius: 16,
    backgroundColor: "#f3f3f3",
    zIndex: 10,
  },
  iconSkeletonTop: {
    top: 5,
  },
  iconSkeletonBottom: {
    bottom: 5,
  },
});
