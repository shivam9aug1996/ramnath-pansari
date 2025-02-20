import { useEffect, useRef, useState } from "react";
import LottieView from "lottie-react-native";
import usePayment from "./usePayment";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/types/global";
import { View } from "react-native";
import { Colors } from "@/constants/Colors";
import { setOrderSuccessView } from "@/redux/features/cartSlice";

 function LottieSuccess() {
  const animation = useRef<LottieView>(null);
  const [start, setStart] = useState(false);
  useEffect(() => {
    setStart(true);
  }, []);

  return (
    <LottieView
      onAnimationFinish={() => {
        setStart(false);
      }}
      autoPlay={start}
      loop={false}
      ref={animation}
      style={{
        width: "100%",
        height: "100%",
        //backgroundColor: Colors.light.background,
      }}
      source={require("../assets/lottie/confetti.json")}
    />
  );
}




const LottieConfetti = ({start,setStart}) => {
  

  useEffect(()=>{
    if(start){
    let timer = setTimeout(()=>{
        setStart(false);
      },3000)
      return ()=>clearTimeout(timer);
    }

  },[start])

  if (!start) return null;

  return (
    <LottieSuccess  />
  );
};



export default LottieConfetti;