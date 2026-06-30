// import { Image } from "expo-image";
// import { memo } from "react";
// import { StyleSheet } from "react-native";
// import { staticImage } from "../CategoryList/utils";

// const ProductImage = ({ image }: { image: string | null }) => (
//   <Image
//     source={{ uri: image || staticImage }}
//     style={styles.image}
//     contentFit="contain"
//     cachePolicy="memory-disk"
//     transition={1000}
//   />
// )

// export default memo(ProductImage);

// const styles = StyleSheet.create({
//   image: {
//     flex: 1,
//     borderRadius: 8,
//   },
// });

import { Image } from "expo-image";
import { memo } from "react";
import { StyleSheet } from "react-native";
import { staticImage } from "../CategoryList/utils";


type ProductImageProps = {
  image: string | null;
  blurhash?: string | null; // when backend adds it
};

const ProductImage = ({ image, blurhash }: ProductImageProps) => {
  const uri = image || staticImage;

  return (
    <Image
    source={{ uri }}
    style={styles.image}
    contentFit="contain"
    placeholderContentFit="contain" // match contentFit — avoids placeholder flicker (docs note)
    placeholder={blurhash ? { blurhash } : undefined}
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