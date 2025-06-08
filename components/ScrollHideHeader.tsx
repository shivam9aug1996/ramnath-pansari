// import React, { useRef, useState } from "react";
// import {
//   Animated,
//   ScrollView,
//   Text,
//   View,
//   StyleSheet,
//   Dimensions,
// } from "react-native";

// const ScrollHideHeader = () => {
//   const scrollOffset = useRef(0); // Tracks the current scroll position
//   const animatedValue = useRef(new Animated.Value(0)).current; // Controls header translation
//   const [isScrollingDown, setIsScrollingDown] = useState(false); // Tracks scroll direction
//   const screenHeight = Dimensions.get("window").height; // Device screen height

//   const handleScroll = (event) => {
//     const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
//     const currentOffset = contentOffset.y;
//     const isBottom =
//       layoutMeasurement.height + contentOffset.y + 20 >= contentSize.height;

//     // Always show the header at the top of the list
//     if (currentOffset <= 0) {
//       Animated.timing(animatedValue, {
//         toValue: 0, // Show the header
//         duration: 300,
//         useNativeDriver: true,
//       }).start();
//       setIsScrollingDown(false);
//       scrollOffset.current = currentOffset;
//       return;
//     }
//     console.log(
//       isBottom,
//       layoutMeasurement.height,
//       contentOffset.y,
//       layoutMeasurement.height + contentOffset.y,
//       contentSize.height
//     );
//     // Hide the header at the bottom of the list
//     if (isBottom) {
//       Animated.timing(animatedValue, {
//         toValue: -100, // Hide the header
//         duration: 300,
//         useNativeDriver: true,
//       }).start();
//       setIsScrollingDown(true);
//       scrollOffset.current = currentOffset;
//       return;
//     }

//     // Detect scrolling direction
//     if (currentOffset > scrollOffset.current) {
//       // Scrolling down
//       if (!isScrollingDown) {
//         Animated.timing(animatedValue, {
//           toValue: -100, // Hide the header
//           duration: 300,
//           useNativeDriver: true,
//         }).start();
//         setIsScrollingDown(true);
//       }
//     } else {
//       // Scrolling up
//       if (isScrollingDown) {
//         Animated.timing(animatedValue, {
//           toValue: 0, // Show the header
//           duration: 300,
//           useNativeDriver: true,
//         }).start();
//         setIsScrollingDown(false);
//       }
//     }

//     scrollOffset.current = currentOffset; // Update the ref's current value
//   };

//   return (
//     <View style={styles.container}>
//       <Animated.View
//         style={[styles.header, { transform: [{ translateY: animatedValue }] }]}
//       >
//         <Text style={styles.headerText}>I am the header</Text>
//       </Animated.View>
//       <ScrollView
//         style={styles.scrollView}
//         onScroll={handleScroll}
//         scrollEventThrottle={16} // Ensures smooth animations
//         contentContainerStyle={styles.contentContainer}
//       >
//         {Array.from({ length: 50 }, (_, i) => (
//           <Text key={i} style={styles.text}>
//             Scrollable Item {i + 1}
//           </Text>
//         ))}
//       </ScrollView>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   header: {
//     height: 100,
//     backgroundColor: "#6200ee",
//     justifyContent: "center",
//     alignItems: "center",
//     position: "absolute",
//     width: "100%",
//     zIndex: 1,
//   },
//   headerText: {
//     color: "#fff",
//     fontSize: 20,
//   },
//   scrollView: {
//     marginTop: 100, // Offset to account for the header height
//   },
//   contentContainer: {
//     paddingVertical: 10,
//   },
//   text: {
//     fontSize: 18,
//     margin: 10,
//   },
// });

// export default ScrollHideHeader;

import React, { useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Text,
  View,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";

const ScrollHideHeader = () => {
  const scrollOffset = useRef(0); // Tracks the current scroll position
  const animatedValue = useRef(new Animated.Value(0)).current; // Controls header translation
  const [isScrollingDown, setIsScrollingDown] = useState(false); // Tracks scroll direction
  const data = Array.from({ length: 50 }, (_, i) => `Scrollable Item ${i + 1}`);

  const handleScroll = (event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const currentOffset = contentOffset.y;
    const isBottom =
      layoutMeasurement.height + contentOffset.y + 20 >= contentSize.height;

    // Always show the header at the top of the list
    if (currentOffset <= 0) {
      Animated.timing(animatedValue, {
        toValue: 0, // Show the header
        duration: 300,
        useNativeDriver: true,
      }).start();
      setIsScrollingDown(false);
      scrollOffset.current = currentOffset;
      return;
    }
    // console.log(
    //   isBottom,
    //   layoutMeasurement.height,
    //   contentOffset.y,
    //   layoutMeasurement.height + contentOffset.y,
    //   contentSize.height
    // );
    // Hide the header at the bottom of the list
    if (isBottom) {
      Animated.timing(animatedValue, {
        toValue: -100, // Hide the header
        duration: 300,
        useNativeDriver: true,
      }).start();
      setIsScrollingDown(true);
      scrollOffset.current = currentOffset;
      return;
    }

    // Detect scrolling direction
    if (currentOffset > scrollOffset.current) {
      // Scrolling down
      if (!isScrollingDown) {
        Animated.timing(animatedValue, {
          toValue: -100, // Hide the header
          duration: 300,
          useNativeDriver: true,
        }).start();
        setIsScrollingDown(true);
      }
    } else {
      // Scrolling up
      if (isScrollingDown) {
        Animated.timing(animatedValue, {
          toValue: 0, // Show the header
          duration: 300,
          useNativeDriver: true,
        }).start();
        setIsScrollingDown(false);
      }
    }

    scrollOffset.current = currentOffset; // Update the ref's current value
  };

  const renderItem = ({ item }) => <Text style={styles.text}>{item}</Text>;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.header, { transform: [{ translateY: animatedValue }] }]}
      >
        <Text style={styles.headerText}>I am the header</Text>
      </Animated.View>
      <FlatList
      bounces={Platform.OS === "android" ? false : true}
        data={data}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        onScroll={handleScroll}
        scrollEventThrottle={16} // Ensures smooth animations
        contentContainerStyle={styles.contentContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 100,
    backgroundColor: "#6200ee",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    width: "100%",
    zIndex: 1,
  },
  headerText: {
    color: "#fff",
    fontSize: 20,
  },
  contentContainer: {
    paddingTop: 100, // Offset to account for the header height
    paddingBottom: 10,
  },
  text: {
    fontSize: 18,
    margin: 10,
  },
});

export default ScrollHideHeader;
