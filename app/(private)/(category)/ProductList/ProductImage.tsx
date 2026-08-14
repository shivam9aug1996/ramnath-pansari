import React, { memo, useMemo } from "react";
import { StyleSheet } from "react-native";
import { Image, ImageProps } from "expo-image";
import { staticImage } from "../CategoryList/utils";

type ProductImageProps = {
  image?: string | null;
  blurhash?: string | null;
  style?: ImageProps["style"];
};

const ProductImage = ({ image, blurhash, style }: ProductImageProps) => {
  const uri = image || staticImage;

  // Memoize placeholder configuration object to preserve stable reference
  const placeholder = useMemo(
    () => (blurhash ? { blurhash } : undefined),
    [blurhash]
  );

  return (
    <Image
      source={{ uri }}
      style={[styles.image, style]}
      contentFit="contain"
      placeholderContentFit="contain"
      placeholder={placeholder}
      cachePolicy="memory-disk"
      recyclingKey={uri}
      transition={0}
      allowDownscaling
    />
  );
};

export default memo(ProductImage);

const styles = StyleSheet.create({
  image: {
    flex: 1,
    borderRadius: 8,
  },
});