// import React, { useEffect } from "react";
// import { View, Text, StyleSheet } from "react-native";
// import { Image } from "expo-image";
// import Animated, {
//   useSharedValue,
//   useAnimatedStyle,
//   withRepeat,
//   withTiming,
//   Easing,
//   SlideInUp,
//   FadeIn,
// } from "react-native-reanimated";

// type WeatherIconProps = {
//   weather: {
//     id: number;
//     main: string;
//     description: string;
//     icon: string;
//   };
//   hour: number;
//   greeting: string;
// };

// const WeatherIcon: React.FC<WeatherIconProps> = ({ weather, greeting }) => {
//   const iconUrl = `https://openweathermap.org/img/wn/${weather.icon}@4x.png`;
//   const translateX = useSharedValue(0);

//   useEffect(() => {
//     translateX.value = withRepeat(
//       withTiming(-10, {
//         duration: 1000,
//         easing: Easing.inOut(Easing.ease),
//       }),
//       -1,
//       true
//     );
//   }, []);

//   const iconAnimation = useAnimatedStyle(() => ({
//     transform: [{ translateX: translateX.value }],
//   }));

//   return (
//     <View style={styles.container}>
//       <Animated.View  style={styles.card}>
//         <View style={styles.row}>
//           {/* <Animated.View style={iconAnimation}>
//             <Image
//               source={{ uri: iconUrl }}
//               style={styles.icon}
//               contentFit="contain"
//             />
//           </Animated.View> */}

//           <Animated.View key={greeting} entering={FadeIn.duration(2000)} style={styles.textWrapper}>
//             <Text style={styles.greetingText}>{greeting}</Text>
//           </Animated.View>
//         </View>
//       </Animated.View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     paddingHorizontal: 20,
//   },
//   card: {
//     marginBottom: 10,
//     paddingHorizontal: 15,
//     paddingVertical: 15,
//     backgroundColor: "#fffae5",
//     borderRadius: 20,
//     borderWidth: 1,
//     borderColor: "#ffd700",
//     shadowColor: "#ffd700",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     elevation: 4,


//   },
//   row: {
//     flexDirection: "row",
//     alignItems: "center",
//    // maxWidth: "90%",
//     // paddingHorizontal: 5,
//     // paddingVertical: 5,
//   },
//   icon: {
//     width: 50,
//     height: 50,
//   },
//   textWrapper: {
//     //marginLeft: 8,
//   },
//   greetingText: {
//     fontSize: 13,
//     color: "#333",
//     fontWeight: "500",
//     fontFamily: "Raleway_400Regular",
//    // paddingRight: 5,
//   },
// });

// export default WeatherIcon;



import React, { memo, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  SlideInUp,
  FadeIn,
} from "react-native-reanimated";
import { truncateText } from "@/utils/utils";

type WeatherIconProps = {
  weather: {
    id: number;
    main: string;
    description: string;
    icon: string;
  };
  hour: number;
  greeting: string;
  backgroundColor: string;
};

const WeatherIcon: React.FC<WeatherIconProps> = ({ weather, greeting,backgroundColor }) => {
  const iconUrl = `https://openweathermap.org/img/wn/${weather.icon}@4x.png`;
  const translateX = useSharedValue(0);

  useEffect(() => {
    // Only animate if the icon is visible (currently commented out in JSX)
    // if (false) { // Placeholder for conditional animation
    translateX.value = withRepeat(
      withTiming(-10, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
    // }
  }, []);

  const iconAnimation = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View   style={[styles.card,{
        backgroundColor:backgroundColor
      }]}>
        <View style={styles.row}>
          {/* If you uncomment this, the icon will also be part of the design */}
          {/* <Animated.View style={iconAnimation}>
            <Image
              source={{ uri: iconUrl }}
              style={styles.icon}
              contentFit="contain"
            />
          </Animated.View> */}

          <Animated.View key={greeting} entering={FadeIn.duration(1500)} style={styles.textWrapper}>
            <Text style={styles.greetingText}>{truncateText(greeting,200)}</Text>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    height:100,
    minHeight:100,
    justifyContent:"center",
    alignItems:"center",
   
   //marginTop: 10, // Added some top margin for better spacing
  },
  card: {
    marginBottom: 10,
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: "#F8ECEC", // Slightly softer white
    borderRadius: 25,       // More rounded corners
    borderWidth: 1,
    borderColor: "#e0e0e0", // Lighter, more subtle border
    shadowColor: "#000",   // Black shadow for more general depth
    shadowOffset: { width: 0, height: 3 }, // Slightly more pronounced shadow
    shadowOpacity: 0.1,     // Reduced opacity for a softer shadow
    shadowRadius: 6,        // Increased radius for a softer shadow
    elevation: 3, 
           // Android elevation
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", // Center the content within the card
  },
  icon: {
    width: 60, // Slightly larger icon if used
    height: 60,
    marginRight: 10, // Space between icon and text
  },
  textWrapper: {
    // No specific styles needed here, as text will naturally center
  },
  greetingText: {
    fontSize: 13, // Slightly larger font size
    color: "#333",
    fontWeight: "600", // Slightly bolder for better readability
    fontFamily: "Raleway_500Medium", // If you have different weights, consider a slightly bolder one
    textAlign: "center", // Ensure text is centered within its wrapper
  },
});

export default memo(WeatherIcon);