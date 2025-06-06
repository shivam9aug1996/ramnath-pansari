import { Image } from "expo-image";
import { memo } from "react";
import { StyleSheet } from "react-native";
import { staticImage } from "../CategoryList/utils";

const ProductImage = memo(({ image }: { image: string | null }) => (
    <Image
      source={{ uri: image || staticImage }}
      style={styles.image}
      contentFit="contain"
      cachePolicy="disk"
      transition={200}
    />
  ));

  export default ProductImage;

  const styles = StyleSheet.create({
    
  image: {
    maxHeight: 100,
    marginBottom: 10,
    minHeight: 100,
    borderRadius: 8,
  },
  });
  
