import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import ToastManager from "toastify-react-native";
import { fonts } from "@/constants/Fonts";
import { Colors } from "@/constants/Colors";
// import { Image } from "expo-image";
// import { Asset } from "expo-asset";

const Toast: React.FC = () => {
  // function cacheImages(images) {
  //   return images.map((image) => {
  //     if (typeof image === "string") {
  //       return Image.prefetch(image);
  //     } else {
  //       return Asset.fromModule(image).downloadAsync();
  //     }
  //   });
  // }

  // useEffect(() => {
  //   const funt = async () => {
  //     const imageAssets = cacheImages([
  //       "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png",
  //       require("../assets/images/bi_arrow-right.png"),
  //     ]);

  //     let g = await Promise.all([...imageAssets]);
  //     console.log("hijhgfghjklkjhgfghjkl", g);
  //   };
  //   funt();
  // }, []);
  return (
    <ToastManager
      style={styles.container}
      textStyle={styles.text}
      position="top"
      duration={2000}
    />
  );
};

export default Toast;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  text: {
    ...fonts.defaultRegular,
    fontSize: 14,
    color: Colors.light.white,
    marginRight: 50,
  },
});
