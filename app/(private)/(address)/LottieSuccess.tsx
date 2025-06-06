import { useEffect, useRef, useState } from "react";
// import LottieView from "lottie-react-native";
import usePayment from "./usePayment";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/types/global";
import { View } from "react-native";
import { Colors } from "@/constants/Colors";

export default function LottieSuccess() {
  const animation = useRef<LottieView>(null);
  const [start, setStart] = useState(false);
  useEffect(() => {
    setStart(true);
  }, []);

  return null

  // return (
  //   <LottieView
  //     onAnimationFinish={() => {
  //       setStart(false);
  //     }}
  //     autoPlay={start}
  //     loop={false}
  //     ref={animation}
  //     style={{
  //       width: "100%",
  //       height: "100%",
  //       backgroundColor: Colors.light.background,
  //     }}
  //     source={{
  //       uri: "https://res.cloudinary.com/dc2z2c3u8/raw/upload/v1732081469/orderSuccess_xlxkxw.json",
  //     }}
  //   />
  // );
}
