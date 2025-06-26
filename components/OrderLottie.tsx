import { Button, StyleSheet, Text, View } from "react-native";
import React, { useEffect, useLayoutEffect, useRef } from "react";
import LottieView from "lottie-react-native";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/types/global";
import { setOrderSuccessView } from "@/redux/features/cartSlice";

const OrderLottie = () => {
  const orderSuccessView = useSelector(
    (state: RootState) => state?.cart?.orderSuccessView || false
  );
  const dispatch = useDispatch();
  const animation = useRef<LottieView>(null);
  useLayoutEffect(() => {
    
    if(orderSuccessView){
        animation.current?.play();
    }
  }, [orderSuccessView]);

  if (!orderSuccessView) return null;
  return (
    <View style={styles.container}>
      <LottieView
        onAnimationFinish={() => {
          dispatch(setOrderSuccessView(false));
          animation.current?.pause();
        }}
        loop={false}
        speed={0.5}
        //autoPlay
        ref={animation}
        style={styles.animation}
        source={require("../assets/lottie/order1.json")}
      />
    </View>
  );
};

export default OrderLottie;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    opacity: 0.8,
  },
  animation: {
    width: "100%",
    height: "100%",
  },
});
