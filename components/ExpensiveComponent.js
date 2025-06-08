// ExpensiveComponent.js
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";

// This simulates an expensive operation (e.g., large data fetch, complex calculation, etc.)
const ExpensiveComponent = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  for(let i = 0; i < 1000; i++) {
   // console.log(i);
  }
  setIsLoaded(true);
//   useEffect(() => {
//     // Simulate a delay to mimic an expensive task
//     const timeout = setTimeout(() => {
//       setIsLoaded(true);
//     }, 3000); // 3 seconds delay

//     return () => clearTimeout(timeout);
//   }, []);

  return (
    <View style={styles.container}>
      {!isLoaded ? (
        <ActivityIndicator size="large" color="blue" />
      ) : (
        <Text style={styles.text}>Expensive Component Loaded!</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default ExpensiveComponent;
