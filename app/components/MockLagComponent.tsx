import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";

const MockLagComponent = () => {
  const [count, setCount] = useState(0);

//   useEffect(() => {
//     let i = 0;

//     const interval = setInterval(() => {
//       setCount((prev) => prev + 1);
//       i++;

//       if (i >= 1000) { // After 100 updates, stop
//         clearInterval(interval);
//       }
//     }, 5); // Every 5ms — rapid updates cause lag

//     return () => clearInterval(interval);
//   });


  return (
    <View style={styles.container}>
      <Text style={styles.text}>Simulating Lag: {count}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "red",
  },
  text: {
    fontSize: 18,
  },
});

export default MockLagComponent;
