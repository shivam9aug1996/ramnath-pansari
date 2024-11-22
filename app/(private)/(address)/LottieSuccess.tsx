import { useRef } from "react";
import LottieView from "lottie-react-native";

export default function LottieSuccess() {
  const animation = useRef<LottieView>(null);

  return (
    <LottieView
      autoPlay
      ref={animation}
      style={{
        width: "100%",
        height: "100%",
      }}
      source={{
        uri: "https://res.cloudinary.com/dc2z2c3u8/raw/upload/v1732081469/orderSuccess_xlxkxw.json",
      }}
    />
  );
}
