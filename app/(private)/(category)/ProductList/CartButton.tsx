// import React, { memo, useEffect } from "react";
// import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";

// import { Colors } from "@/constants/Colors";

// import { CartButtonProps, RootState } from "@/types/global";

// import { useCartOperations } from "../../hooks/useCartOperations";
// import Animation from "./Animation";
// import { useSelector } from "react-redux";
// import { Image } from "expo-image";
// import { useCartOperationsV1 } from "../../hooks/useCartOperationsV1";
// import { hideAllToast, showToast } from "@/utils/utils";
// import Animated, { useSharedValue } from "react-native-reanimated";
// import { withSequence } from "react-native-reanimated";
// import { withTiming } from "react-native-reanimated";
// import { useAnimatedStyle } from "react-native-reanimated";
// import AnimatedQuantity from "./AnimatedQuantity";

// const CartButton = ({ value, item }: CartButtonProps) => {
//   const { quantity, handleAdd, handleRemove } = useCartOperations(item, value);
//     const cartButtonProductId = useSelector(
//     (state: RootState) => state.cart.cartButtonProductId || []
//   );

// console.log("quantity8765876556789",quantity)
//   return (
//     <View style={[styles.container]}>
//       {!item?.isOutOfStock && (
//         <View
//           style={{
//             flexDirection: "row",
//             justifyContent: quantity > 0 ? "space-between" : "flex-end",
//           }}
//         >
//           {quantity > 0 && (
//             <TouchableOpacity
//               disabled={item?.isOutOfStock}
//               onPress={()=>{
//               //   if(isLoading){
//               //     showToast({
//               //       type: "info",
//               //       text2:
//               //         "Please wait a moment — we’re still updating your cart.",
//               //   });
//               //   return;
//               // }
//               handleRemove();
//             }}
//               style={[styles.removeButton]}
//             >
//               <Image
//                 source={require("../../../../assets/images/entypo_minus.png")}
//                 style={styles.icon}
//                 tintColor="white"
//               />
//             </TouchableOpacity>
//           )}

//           {/* {quantity > 0 && (
//             <View style={styles.quantityContainer}>
//               {<Text style={styles.quantityText}>{quantity}</Text>}
//             </View>
            
//           )} */}
//           {quantity > 0 && <AnimatedQuantity quantity={quantity} />}

//           <TouchableOpacity
//             disabled={item?.isOutOfStock}
//             onPress={()=>{
//               // if(isLoading){
//               //   showToast({
//               //     type: "info",
//               //     text2:
//               //       "Please wait a moment — we’re still updating your cart.",
//               //   });
//               //   return;
//               // }
//               handleAdd();
//             }}
//             style={[styles.addButton]}
//           >
//             <Image
//               source={require("../../../../assets/images/entypo_plus.png")}
//               style={styles.icon}
//               tintColor="white"
//             />
//           </TouchableOpacity>
//         </View>
//       )}
//       {/* {isLoading&&<Text>hi</Text>} */}
//       {/* <Animation id={item?._id} isOutOfStock={item?.isOutOfStock} /> */}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     position: "absolute",
//     bottom: 0,
//     width: "100%",
//     flex: 1,
//     borderBottomLeftRadius: 28,
//     borderBottomRightRadius: 28,
//   },
//   addButton: {
//     paddingHorizontal: 18,
//     paddingVertical: 10,
//     borderTopLeftRadius: 12,
//     borderBottomRightRadius: 28,
//     backgroundColor: Colors.light.gradientGreen_2,
//   },
//   removeButton: {
//     paddingHorizontal: 18,
//     paddingVertical: 10,
//     borderTopRightRadius: 12,
//     borderBottomLeftRadius: 28,
//     backgroundColor: Colors.light.gradientGreen_2,
//   },
//   quantityContainer: {
//     alignSelf: "center",
//     paddingBottom: 5,
//     fontFamily: "Montserrat_500Medium",
//   },
//   quantityText: {
//     fontSize: 20,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   icon: {
//     width: 18,
//     height: 18,
//   },
//   updateContainer: {
//     backgroundColor: Colors.light.lightGrey,
//     position: "absolute",
//     width: "100%",
//     height: 60,
//     bottom: 0,
//     borderBottomRightRadius: 28,
//     borderBottomLeftRadius: 28,
//     justifyContent: "center",
//     alignItems: "center",
//     zIndex: 700,
//   },
// });

// export default memo(CartButton);



// import React, { memo, useEffect } from "react";
// import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
// import Animated, {
//   useSharedValue,
//   useAnimatedStyle,
//   withTiming,
//   interpolate,
// } from "react-native-reanimated";
// import { CartButtonProps } from "@/types/global";
// import { useCartOperations } from "../../hooks/useCartOperations";

// const CartButton = ({ value, item }: CartButtonProps) => {
//   const { quantity, handleAdd, handleRemove } = useCartOperations(item, value);

//   const animatedWidth = useSharedValue(quantity > 0 ? 100 : 70);

//   useEffect(() => {
//     animatedWidth.value = withTiming(quantity > 0 ? 100 : 70, {
//       duration: 300,
//     });
//   }, [quantity]);

//   const animatedStyle = useAnimatedStyle(() => {
//     return {
//       width: animatedWidth.value,
//     };
//   });

//   if (item?.isOutOfStock) {
//     return (
//       <View style={styles.container}>
//         <View style={styles.outOfStockButton}>
//           <Text style={styles.outOfStockText}>Out of Stock</Text>
//         </View>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <Animated.View style={[styles.animatedWrapper, animatedStyle]}>
//         {quantity > 0 ? (
//           <View style={styles.quantityContainer}>
//             <TouchableOpacity
//               hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//               onPress={handleRemove}
//               style={styles.quantityButton}
//               activeOpacity={0.7}
//             >
//               <Text style={styles.buttonText}>−</Text>
//             </TouchableOpacity>
//             <View style={styles.quantityDisplay}>
//               <Text style={styles.quantityText}>{quantity}</Text>
//             </View>
//             <TouchableOpacity
//               onPress={handleAdd}
//               style={styles.quantityButton}
//               activeOpacity={0.7}
//             >
//               <Text style={styles.buttonText}>+</Text>
//             </TouchableOpacity>
//           </View>
//         ) : (
//           <TouchableOpacity
//             onPress={handleAdd}
//             style={styles.addButton}
//             activeOpacity={0.8}
//           >
//             <Text style={styles.addButtonText}>ADD</Text>
//           </TouchableOpacity>
//         )}
//       </Animated.View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     position: "absolute",
//     bottom: 8,
//     right: 8,
//     zIndex: 10,
//    // padding: 10,
//   },
//   animatedWrapper: {
//     height: 36,
//    // overflow: "hidden",
//     //borderRadius: 8,
//   },
//   addButton: {
//     backgroundColor: "#ffffff",
//     borderWidth: 1.5,
//     borderColor: "#0d9448",
//     paddingVertical: 8,
//     paddingHorizontal: 10,
//     alignItems: "center",
//     justifyContent: "center",
//     height: "100%",
//     borderRadius: 8,
//   },
//   addButtonText: {
//     color: "#0d9448",
//     fontSize: 13,
//     fontWeight: "700",
//     letterSpacing: 0.8,
//   },
//   quantityContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#0d9448",
//     paddingVertical: 4,
//     paddingHorizontal: 4,
//     height: "100%",
//     borderRadius: 8,
//   },
//   quantityButton: {
//     width: 28,
//     height: 28,
//     alignItems: "center",
//     justifyContent: "center",
//     borderRadius: 4,
//   },
//   buttonText: {
//     color: "#ffffff",
//     fontSize: 18,
//     fontWeight: "500",
//     lineHeight: 18,
//   },
//   quantityDisplay: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     paddingHorizontal: 8,
//   },
//   quantityText: {
//     color: "#ffffff",
//     fontSize: 16,
//     fontWeight: "700",
//   },
//   outOfStockButton: {
//     backgroundColor: "#f8f9fa",
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: "#e9ecef",
//     paddingVertical: 8,
//     paddingHorizontal: 20,
//     alignItems: "center",
//     justifyContent: "center",
//     minWidth: 70,
//     height: 36,
//   },
//   outOfStockText: {
//     color: "#6c757d",
//     fontSize: 12,
//     fontWeight: "600",
//   },
// });

// export default memo(CartButton);




import React, { memo, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Pressable, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { CartButtonProps } from "@/types/global";
import { useCartOperations } from "../../hooks/useCartOperations";
import { Colors } from "@/constants/Colors";
import AnimatedQuantity from "./AnimatedQuantity";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

const CartButton = ({ value, item }: CartButtonProps) => {
  const { quantity, handleAdd, handleRemove } = useCartOperations(item, value);

  const animatedWidth = useSharedValue(quantity > 0 ? 100 : 75);

  useEffect(() => {
    animatedWidth.value = withTiming(quantity > 0 ? 100 : 75, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    });
  }, [quantity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: animatedWidth.value,
    };
  });

  if (item?.isOutOfStock) {
    return (
      <View style={styles.container}>
        <View style={styles.outOfStockButton}>
          <Text style={styles.outOfStockText}>Out of Stock</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      <Animated.View style={[styles.animatedWrapper, animatedStyle]}>
     

        {quantity > 0 ? (
          <View style={styles.quantityContainer}>
            <TouchableOpacity
             
              onPress={handleRemove}
              style={styles.quantityButton}
             activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>−</Text>
            </TouchableOpacity>
            <View style={styles.quantityDisplay}>
              <Text style={styles.quantityText}>{quantity}</Text>
            </View>
            <TouchableOpacity
              onPress={handleAdd}
              style={styles.quantityButton}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
         
            onPress={handleAdd}
            style={styles.addButton}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>ADD</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 8,
    right: 8,
    zIndex: 10,
    padding:10,
    
  },
  animatedWrapper: {
    height: 36,
    overflow: "hidden",
  },
  addButton: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1.5,
    borderColor: "#0d9448",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    borderRadius: 8,
  },
  addButtonText: {
    color: "#0d9448",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: 'rgba(38, 173, 113, 0.9)',
    paddingVertical: 4,
    paddingHorizontal: 4,
    height: "100%",
    borderRadius: 8,
  },
  quantityButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "500",
    lineHeight: 18,
  },
  quantityDisplay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  quantityText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  outOfStockButton: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 70,
    height: 36,
  },
  outOfStockText: {
    color: "#6c757d",
    fontSize: 12,
    fontWeight: "600",
  },
});

export default memo(CartButton);
