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

import { categoryListPlaceholder, imageBorderStyle } from "./utils";
import { arrayColor } from "./constants";

type Variant = "small" | "large";

type Props = {
  contentContainerStyle?: ViewStyle;
  variant?: Variant;
};

const IMAGE_SIZES: Record<Variant, number> = {
  small: 32,
  large: 60,
};

const MAX_WIDTHS: Record<Variant, number> = {
  small: 64,
  large: 80,
};

const IMAGE_PADDING: Record<Variant, number> = {
  small: 4,
  large: 10,
};

const SKELETON_BG = "#f3f3f3";
const SKELETON_FG = "#ecebeb";

const RenderImageLoader = memo(function RenderImageLoader({
  size,
}: {
  size: number;
}) {
  if (Platform.OS === "web") {
    return <View style={[styles.webImageSkeleton, { width: size, height: size }]} />;
  }

  return (
    <ContentLoader
      speed={2}
      width={size}
      height={size}
      backgroundColor={SKELETON_BG}
      foregroundColor={SKELETON_FG}
    >
      <Rect rx={5} ry={5} width={size} height={size} />
    </ContentLoader>
  );
});

const RenderTextSkeleton = memo(function RenderTextSkeleton() {
  if (Platform.OS === "web") {
    return (
      <View style={styles.webTextWrap}>
        <View style={styles.webTextLine} />
        <View style={styles.webTextLine} />
      </View>
    );
  }

  return (
    <ContentLoader
      speed={2}
      width={67}
      height={28.7}
      backgroundColor={SKELETON_BG}
      foregroundColor={SKELETON_FG}
      style={styles.contentLoaderText}
    >
      <Rect rx={5} ry={5} width="67" y={0} height="10" />
      <Rect rx={5} ry={5} width="67" y={14} height="10" />
    </ContentLoader>
  );
});

const CategorySelectorPlaceholder = ({
  contentContainerStyle,
  variant = "small",
}: Props) => {
  const imageSize = IMAGE_SIZES[variant];
  const maxWidth = MAX_WIDTHS[variant];
  const imagePadding = IMAGE_PADDING[variant];

  const keyExtractor = useCallback(
    (item: any, index: number) => item?._id ?? `placeholder-${index}`,
    [],
  );

  const renderCategory = useCallback(
    ({ item, index }: ListRenderItemInfo<any>) => {
      const borderStyle = imageBorderStyle(arrayColor, false, index);

      return (
        <View
          key={item?._id || index}
          style={[styles.categoryContainer, { maxWidth }]}
        >
          <View
            style={[
              styles.imageContainer,
              borderStyle,
              {
                paddingVertical: imagePadding,
                paddingHorizontal: imagePadding,
              },
            ]}
          >
            <RenderImageLoader size={imageSize} />
          </View>
          <RenderTextSkeleton />
        </View>
      );
    },
    [imagePadding, imageSize, maxWidth],
  );

  return (
    <FlatList
      bounces={Platform.OS !== "android"}
      contentContainerStyle={contentContainerStyle}
      data={categoryListPlaceholder}
      horizontal
      keyExtractor={keyExtractor}
      showsHorizontalScrollIndicator={false}
      renderItem={renderCategory}
      initialNumToRender={8}
    />
  );
};

export default memo(CategorySelectorPlaceholder);

const styles = StyleSheet.create({
  categoryContainer: {
    marginTop: 6,
    marginRight: 8,
    alignItems: "center",
  },
  imageContainer: {
    borderRadius: 10,
    marginBottom: 4,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  webImageSkeleton: {
    borderRadius: 5,
    backgroundColor: SKELETON_BG,
  },
  webTextWrap: {
    alignSelf: "center",
    gap: 4,
  },
  webTextLine: {
    width: 67,
    height: 10,
    borderRadius: 5,
    backgroundColor: SKELETON_BG,
  },
  contentLoaderText: {
    alignSelf: "center",
  },
});