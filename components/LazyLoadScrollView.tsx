// import React, { useState, useRef, useEffect } from "react";
// import { ScrollView, View, Text, Dimensions, StyleSheet } from "react-native";
// import _ from "lodash";

// const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// const LazyLoadScrollView = () => {
//   const [visibleItems, setVisibleItems] = useState([]);
//   const positions = useRef({}).current;

//   // Debounced function to handle scroll
//   const handleScroll = _.debounce((scrollPosition) => {
//     const visibleItems = Object.keys(positions).filter((key) => {
//       const itemPosition = positions[key];
//       return (
//         itemPosition.top < scrollPosition + SCREEN_HEIGHT &&
//         itemPosition.bottom > scrollPosition
//       );
//     });

//     setVisibleItems(visibleItems);
//   }, 100); // Adjust the delay (in ms) as needed

//   const onScrollHandler = (event) => {
//     const { contentOffset } = event.nativeEvent;
//     handleScroll(contentOffset.y);
//   };

//   const handleLayout = (key, event) => {
//     const { y, height } = event.nativeEvent.layout;
//     positions[key] = { top: y, bottom: y + height };
//   };

//   const renderItem = (key, height, label) => (
//     <View
//       key={key}
//       onLayout={(event) => handleLayout(key, event)}
//       style={[styles.item, { height }]}
//     >
//       {visibleItems.includes(key.toString()) ? (
//         <Text style={styles.text}>{label}</Text>
//       ) : (
//         <Text style={styles.text}>Loading... {label}</Text>
//       )}
//     </View>
//   );

//   useEffect(() => {
//     // Cleanup debounce on component unmount
//     return () => {
//       handleScroll.cancel();
//     };
//   }, []);
//   console.log(visibleItems);

//   return (
//     <ScrollView
//       style={styles.container}
//       onScroll={onScrollHandler}
//       scrollEventThrottle={16}
//     >
//       {renderItem(1, 300, "View 1")}
//       {renderItem(2, 500, "View 2")}
//       {renderItem(3, 400, "View 3")}
//       {renderItem(4, 350, "View 4")}
//       {renderItem(5, 250, "View 5")}
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   item: {
//     justifyContent: "center",
//     alignItems: "center",
//     borderBottomWidth: 1,
//     borderColor: "#ccc",
//   },
//   text: {
//     fontSize: 18,
//   },
// });

// export default LazyLoadScrollView;

import React, { useState, useRef, useEffect } from "react";
import { ScrollView, View, Text, Dimensions, StyleSheet, Platform } from "react-native";
import _ from "lodash";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const LazyLoadScrollView = () => {
  const [visibleItems, setVisibleItems] = useState([]);
  const positions = useRef({}).current;
  const layoutCount = useRef(0); // Track the number of layouts registered

  const handleScroll = _.debounce((scrollPosition) => {
    const visibleItems = Object.keys(positions).filter((key) => {
      const itemPosition = positions[key];
      return (
        itemPosition.top < scrollPosition + SCREEN_HEIGHT &&
        itemPosition.bottom > scrollPosition
      );
    });

    setVisibleItems(visibleItems);
  }, 100);

  const onScrollHandler = (event) => {
    const { contentOffset } = event.nativeEvent;
    handleScroll(contentOffset.y);
  };

  const handleLayout = (key, event) => {
    const { y, height } = event.nativeEvent.layout;
    positions[key] = { top: y, bottom: y + height };
    layoutCount.current += 1;

    // Trigger visibility check when all items have been laid out
    if (layoutCount.current === 5) {
      const initialVisibleItems = Object.keys(positions).filter((key) => {
        const itemPosition = positions[key];
        return itemPosition.top < SCREEN_HEIGHT && itemPosition.bottom > 0;
      });
      setVisibleItems(initialVisibleItems);
    }
  };

  const renderItem = (key, height, label) => (
    <View
      key={key}
      onLayout={(event) => handleLayout(key, event)}
      style={[styles.item, { height }]}
    >
      {visibleItems.includes(key.toString()) ? (
        <Text style={styles.text}>{label}</Text>
      ) : (
        <Text style={styles.text}>Loading... {label}</Text>
      )}
    </View>
  );

  useEffect(() => {
    // Cleanup debounce on component unmount
    return () => {
      handleScroll.cancel();
    };
  }, []);

  return (
    <ScrollView
    bounces={Platform.OS === "android" ? false : true}
      style={styles.container}
      onScroll={onScrollHandler}
      scrollEventThrottle={16}
    >
      {renderItem(1, 300, "View 1")}
      {renderItem(2, 500, "View 2")}
      {renderItem(3, 400, "View 3")}
      {renderItem(4, 350, "View 4")}
      {renderItem(5, 250, "View 5")}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  item: {
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  text: {
    fontSize: 18,
  },
});

export default LazyLoadScrollView;
