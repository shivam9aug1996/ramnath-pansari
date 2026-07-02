import { StyleSheet, View } from "react-native";
import React, { memo } from "react";
import ContentLoader, { Rect } from "react-content-loader/native";
import CategorySelectorPlaceholder from "@/app/(private)/(category)/CategoryList/CategorySelectorPlaceholder";
import { Platform } from "react-native";

const LoaderBlock = ({
  width = 100,
  height = 16,
}: {
  width?: number | string;
  height?: number;
}) => {
  if (Platform.OS === "web") {
    return (
      <View
        style={{
          width: typeof width === "number" ? width : 100,
          height,
          borderRadius: 5,
          backgroundColor: "#f3f3f3",
        }}
      />
    );
  }
  return (
    <ContentLoader
      speed={2}
      width={width}
      height={height}
      backgroundColor="#f3f3f3"
      foregroundColor="#ecebeb"
    >
      <Rect rx={5} ry={5} width={width} height={height} />
    </ContentLoader>
  );
};

const CategoryCardPlaceholder = ({
  index = 0,
  length = 1,
}: {
  index?: number;
  length?: number;
}) => {
  return (
    <View
      style={[
        styles.cardWrapper,
        { marginBottom: index !== length - 1 ? 16 : 0 },
      ]}
    >
      <View style={styles.categoryCard}>
        <View style={styles.titleRow}>
          <View style={styles.emojiSkeleton} />
          <LoaderBlock width={100} height={16} />
        </View>

        <View style={styles.childrenContainer}>
          <CategorySelectorPlaceholder
            variant="large"
            contentContainerStyle={{ paddingHorizontal: 20 }}
          />
        </View>
      </View>
    </View>
  );
};

export default memo(CategoryCardPlaceholder);

const styles = StyleSheet.create({
  cardWrapper: {},
  categoryCard: {
    backgroundColor: "#fff",
    paddingVertical: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  emojiSkeleton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#f3f3f3",
  },
  childrenContainer: {
    marginTop: 8,
  },
});
