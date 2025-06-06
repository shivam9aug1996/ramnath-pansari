// import React, { memo, useEffect, useMemo, useState } from "react";
// import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
// import { Colors } from "@/constants/Colors";
// import { useSelector } from "react-redux";
// import { setShowConfetti, useFetchCartQuery } from "@/redux/features/cartSlice";
// import { router } from "expo-router";
// import { calculateTotalAmount } from "@/components/cart/utils";
// import { formatNumber } from "@/utils/utils";
// import { Ionicons } from "@expo/vector-icons";
// import LottieConfetti from "@/components/LottieConfetti";
// import { Animated, Easing } from "react-native";
// import { useDispatch } from "react-redux";
// import MockLagComponent from "@/app/components/MockLagComponent";


// const AnimatedBorder = ({isCart=false}) => {
//   const animatedValue = React.useRef(new Animated.Value(0)).current;
//   const scaleValue = React.useRef(new Animated.Value(1)).current;
//   React.useEffect(() => {
//     // Color animation
//     Animated.loop(
//       Animated.timing(animatedValue, {
//         toValue: 1,
//         duration: 2000,
//         easing: Easing.linear,
//         useNativeDriver: false,
//       })
//     ).start();

   
//   }, []);



//   return (
//     <Animated.View
//       style={{
//         position: 'absolute',
//         top: 0,
//         left: 0,
//         right: 0,
//         bottom: 0,
//         borderWidth: 5,
//         borderRadius: isCart?10:0,
//         borderLeftWidth: isCart?5:0,
//         borderRightWidth: isCart?5:0,
//        // transform: [{ scale: scaleValue }],
//         borderColor: animatedValue.interpolate({
//           inputRange: [0, 0.33, 0.66, 1],
//           outputRange: ['#FFD700', '#FFA500', '#FF69B4', '#FFD700'], // Gold -> Orange -> Pink -> Gold
//         }),
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 0 },
//         shadowOpacity: 0.3,
//         shadowRadius: 5,
//         opacity: animatedValue.interpolate({
//           inputRange: [0, 0.5, 1],
//           outputRange: [0.6, 1, 0.6],
//         }),
//       }}
//     />
//   );
// };



// const GoToCart = ({ isCart }) => {
//   const userId = useSelector((state) => state.auth?.userData?._id);
//   const { data: cartData } = useFetchCartQuery({ userId }, { skip: !userId });
//   const cartItems = cartData?.cart?.items?.length || 0;
//   const isInitialMount = React.useRef(true);
//   const showConfetti = useSelector((state) => state.cart?.showConfetti);

//    //const [showConfetti, setShowConfetti] = useState(false);
// const dispatch = useDispatch()
//   const totalAmount = useMemo(
//     () => calculateTotalAmount(cartData?.cart?.items)?.toFixed(2),
//     [cartData?.cart?.items]
//   );



//   const remainingAmount = Math.max(1000 - (totalAmount || 0), 0);

//   useEffect(() => {
//     if (isInitialMount.current) {
//       isInitialMount.current = false;
//       return;
//     }
//     let timer;
//     if (remainingAmount <= 0&&cartItems) {
//      // setShowConfetti(true);

//       dispatch(setShowConfetti(true))
//       timer = setTimeout(() => {
//         dispatch(setShowConfetti(false))
//       }, 3000);
//     }
//     return () => {
//       // setShowConfetti(false);
//       if (timer) {
//         clearTimeout(timer);
//       }
//     };
//   }, [remainingAmount]);

//   if (!cartItems) return null;

//   if (isCart) {
//     return remainingAmount > 0 ? (
//       <View
//         style={[
//           styles.offerMessage,
//           {
//             borderRadius: 10,
//             marginBottom: 0,
//           },
//         ]}
//       >
        
//         <Text style={styles.offerText}>
//           {`Add items worth `}
//           <Text style={styles.remainingAmount}>{`₹${formatNumber(
//             remainingAmount
//           )}`}</Text>
//           {` to get 
// 1 kg sugar free`}
//         </Text>
//       </View>
//     ) : (
//       <>
//         <View
//           style={[
//             styles.offerMessage,
//             {
//               borderRadius: 10,
//               marginBottom: 0,
//             },
//           ]}
//         >
//           <Text style={styles.offerText}>
//             {"Congratulations! You are eligible for 1 kg sugar free! 🎉 "}
//           </Text>
//           {showConfetti && <AnimatedBorder isCart={isCart} />}
//         </View>
//         {/* {showConfetti && (
//           <View
//             style={{
//               position: "absolute",
//               top: 0,
//               left: 0,
//               right: 0,
//               bottom: 0,
//               zIndex: 1000,
//             }}
//           >
//             <LottieConfetti start={showConfetti} setStart={setShowConfetti} />
//           </View>
//         )} */}
//       </>
//     );
//   }

//   return (
//     <>
     
//     <TouchableOpacity
//       onPress={() => router.navigate("/(cartScreen)/cartScreen")}
//       style={styles.cartButtonContainer}
//     >
//       {remainingAmount > 0 ? (
//         <View style={styles.offerMessage}>
          
//           <Text style={styles.offerText}>
//             {`Add items worth `}
//             <Text style={styles.remainingAmount}>{`₹${formatNumber(
//               remainingAmount
//             )}`}</Text>
//             {` to get 1 kg sugar free`}
//           </Text>
//         </View>
//       ) : (
        
//         <View style={styles.offerMessage}>
          
//           <Text style={styles.offerText}>
//             {`Congratulations! You are eligible for 1 kg sugar free! 🎉 `}
//           </Text>
//           {showConfetti && <AnimatedBorder />}
//         </View>
       
        
//       )}
      
//       <View style={styles.cartButton}>
//         <Text style={styles.cartText}>
//           {`${cartItems} Items | ₹${formatNumber(totalAmount)}`}
//         </Text>
//         <View style={styles.cartAction}>
//           <Ionicons name="bag-outline" size={18} color={Colors.light.white} />
//           <Text style={styles.cartActionText}>View Cart</Text>
//         </View>
//       </View>
//     </TouchableOpacity>
//     {/* {showConfetti && (
//           <View
//             style={{
//               position: "absolute",
//               top: 0,
//               left: 0,
//               right: 0,
//               bottom: 0,
//               zIndex: 1000,
//             }}
//           >
//             <LottieConfetti start={showConfetti} setStart={setShowConfetti} />
//           </View>
//         )} */}
//     </>
//   );
// };

// export default memo(GoToCart);

// const styles = StyleSheet.create({
//   cartButtonContainer: {
//     backgroundColor: Colors.light.white,
//     paddingVertical: 15,
//     paddingTop: 0,
//   },
//   offerMessage: {
//     backgroundColor: "#967c8e",
//     marginBottom: 5,
//     paddingHorizontal: 20,
//     paddingVertical: 8,
//   },
//   offerText: {
//     color: "white",
//     fontSize: 14,
//     fontFamily: "Raleway_700Bold",
//     textAlign: "center",
//     //letterSpacing: 0.3,
//   },
//   cartButton: {
//     backgroundColor: Colors.light.gradientGreen_1,
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     borderRadius: 20,
//     paddingVertical: 15,
//     paddingHorizontal: 30,
//     marginHorizontal: 10,
//   },
//   cartText: {
//     color: Colors.light.white,
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   cartAction: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   cartActionText: {
//     color: Colors.light.white,
//     fontSize: 16,
//     marginLeft: 5,
//     fontFamily: "Raleway_700Bold",
//   },
//   remainingAmount: {
//     color: "#e2ea91",
//     fontSize: 14,
//     fontFamily: "Montserrat_700Bold",
//   },
// });



import React, { memo, useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Colors } from "@/constants/Colors";
import { useSelector } from "react-redux";
import { setShowConfetti, useFetchCartQuery } from "@/redux/features/cartSlice";
import { router } from "expo-router";
import { calculateTotalAmount } from "@/components/cart/utils";
import { formatNumber } from "@/utils/utils";
import { Ionicons } from "@expo/vector-icons";
import Animated, { 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  useSharedValue,
  withSequence,
  withDelay,
  Easing
} from "react-native-reanimated";
import { useDispatch } from "react-redux";
import { RootState } from "@/types/global";

const AnimatedBorder = ({isCart=false}) => {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { 
        duration: 2000,
        easing: Easing.linear 
      }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const colors = ['#FFD700', '#FFA500', '#FF69B4', '#FFD700'];
    const colorIndex = Math.floor(progress.value * 3);
    const nextColorIndex = (colorIndex + 1) % 4;
    const colorProgress = (progress.value * 3) % 1;
    
    const currentColor = colors[colorIndex];
    const nextColor = colors[nextColorIndex];
    
    const opacity = 0.6 + Math.sin(progress.value * Math.PI * 2) * 0.2;

    return {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderWidth: 5,
      borderRadius: isCart ? 10 : 0,
      borderLeftWidth: isCart ? 5 : 0,
      borderRightWidth: isCart ? 5 : 0,
      borderColor: currentColor,
      // shadowColor: '#000',
      // //shadowOffset: { width: 0, height: 0 },
      // shadowOpacity: 0.3,
      // shadowRadius: 5,
      opacity: opacity,
    };
  });

  return <Animated.View style={animatedStyle} />;
};

const GoToCart = ({ isCart }) => {
  console.log("render123456567890789")
  const isCartOperationProcessing = useSelector(
    (state: RootState) => state?.cart?.isCartOperationProcessing
  );
  const cartButtonProductId = useSelector(
    (state: RootState) => state.cart.cartButtonProductId
  );

  
  const userId = useSelector((state) => state.auth?.userData?._id);
  const { data: cartData } = useFetchCartQuery({ userId }, { skip: !userId });
  const cartItems = cartData?.cart?.items?.length || 0;
  const isInitialMount = React.useRef(true);
  const showConfetti = useSelector((state) => state.cart?.showConfetti);
  const dispatch = useDispatch();

  const totalAmount = useMemo(
    () => calculateTotalAmount(cartData?.cart?.items)?.toFixed(2),
    [cartData?.cart?.items]
  );

  const remainingAmount = Math.max(1000 - (totalAmount || 0), 0);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    let timer;
    if (remainingAmount <= 0 && cartItems) {
      dispatch(setShowConfetti(true));
      timer = setTimeout(() => {
        dispatch(setShowConfetti(false));
      }, 3000);
    }
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [remainingAmount]);

  if (!cartItems) return null;

  if (isCart) {
    return remainingAmount > 0 ? (
      <View
        style={[
          styles.offerMessage,
          {
            borderRadius: 10,
            marginBottom: 0,
          },
        ]}
      >
        <Text style={styles.offerText}>
          {`Add items worth `}
          <Text style={styles.remainingAmount}>{`₹${formatNumber(
            remainingAmount
          )}`}</Text>
          {` to get 1 kg sugar free`}
        </Text>
      </View>
    ) : (
      <>
        <View
          style={[
            styles.offerMessage,
            {
              borderRadius: 10,
              marginBottom: 0,
              
            },
          ]}
        >
          <Text style={styles.offerText} numberOfLines={2}>
            {"Congratulations! You are eligible for 1 kg sugar free! 🎉 "}
          </Text>
          {showConfetti && <AnimatedBorder isCart={isCart} />}
        </View>
      </>
    );
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => router.navigate("/(cartScreen)/cartScreen")}
        style={styles.cartButtonContainer}
      >
        {remainingAmount > 0 ? (
          <View style={styles.offerMessage}>
            <Text style={styles.offerText}>
              {`Add items worth `}
              <Text style={styles.remainingAmount}>{`₹${formatNumber(
                remainingAmount
              )}`}</Text>
              {` to get 1 kg sugar free`}
            </Text>
          </View>
        ) : (
          <View style={styles.offerMessage}>
            <Text style={styles.offerText}>
              {`Congratulations! You are eligible for 1 kg sugar free! 🎉 `}
            </Text>
            {showConfetti && <AnimatedBorder />}
          </View>
        )}
        
        <View style={styles.cartButton}>
          {isCartOperationProcessing||cartButtonProductId?.length>0 ?  <View style={{flex:1, justifyContent:"flex-start", alignItems:"center",flexDirection:"row"}}>
            <Text style={styles.cartText}>
             {`Updating cart... `} 
          </Text>
          <ActivityIndicator size="small" color={Colors.light.white} />
          </View> :
          <Text style={styles.cartText}>
             {`${cartItems} Items | ₹${formatNumber(totalAmount)}`}
          </Text>
          }
          <View style={styles.cartAction}>
            <Ionicons name="bag-outline" size={18} color={Colors.light.white} />
            <Text style={styles.cartActionText}>View Cart</Text>
          </View>
        </View>
      </TouchableOpacity>
    </>
  );
};

export default memo(GoToCart);

const styles = StyleSheet.create({
  cartButtonContainer: {
    backgroundColor: Colors.light.white,
    paddingVertical: 15,
    paddingTop: 0,
  },
  offerMessage: {
    backgroundColor: "#967c8e",
    marginBottom: 5,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  offerText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Raleway_700Bold",
    textAlign: "center",
  },
  cartButton: {
    backgroundColor: Colors.light.gradientGreen_1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 30,
    marginHorizontal: 10,
  },
  cartText: {
    color: Colors.light.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  cartAction: {
    flexDirection: "row",
    alignItems: "center",
  },
  cartActionText: {
    color: Colors.light.white,
    fontSize: 16,
    marginLeft: 5,
    fontFamily: "Raleway_700Bold",
  },
  remainingAmount: {
    color: "#e2ea91",
    fontSize: 14,
    fontFamily: "Montserrat_700Bold",
  },
});