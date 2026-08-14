import React, { memo, useCallback } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  View,
  ListRenderItemInfo,
  ViewStyle,
} from "react-native";
import ContentLoader, { Rect } from "react-content-loader/native";

import { categoryListPlaceholder } from "./utils";

type Props = {
  contentContainerStyle?: ViewStyle;
};

const SKELETON_BG = "#f3f3f3";
const SKELETON_FG = "#ecebeb";

const SkeletonChip = memo(function SkeletonChip({ index }: { index: number }) {
  const width = index === 0 ? 50 : 84;

  if (Platform.OS === "web") {
    return (
      <View
        style={[
          styles.loaderStyle,
          styles.webChip,
          { width },
        ]}
      />
    );
  }

  return (
    <ContentLoader
      speed={2}
      width={width}
      height={28}
      backgroundColor={SKELETON_BG}
      foregroundColor={SKELETON_FG}
      style={styles.loaderStyle}
    >
      <Rect rx={14} ry={14} width={width} height={28} />
    </ContentLoader>
  );
});

const SubCategorySelectorPlaceholder = ({ contentContainerStyle }: Props) => {
  const placeholderData = categoryListPlaceholder[0]?.children ?? [];

  const keyExtractor = useCallback(
    (item: any, index: number) => item?._id ?? `sub-placeholder-${index}`,
    [],
  );

  const renderSubCategory = useCallback(
    ({ index }: ListRenderItemInfo<any>) => <SkeletonChip index={index} />,
    [],
  );

  return (
    <FlatList
      bounces={Platform.OS !== "android"}
      contentContainerStyle={contentContainerStyle}
      data={placeholderData}
      horizontal
      keyExtractor={keyExtractor}
      showsHorizontalScrollIndicator={false}
      renderItem={renderSubCategory}
      initialNumToRender={8}
    />
  );
};

export default memo(SubCategorySelectorPlaceholder);

const styles = StyleSheet.create({
  loaderStyle: {
    marginRight: 8,
    marginBottom: 6,
    marginTop: 4,
    borderRadius: 16,
  },
  webChip: {
    height: 28,
    backgroundColor: SKELETON_BG,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});