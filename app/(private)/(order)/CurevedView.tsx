import React from "react";
import { View, StyleSheet, Text } from "react-native";
import Svg, { Path } from "react-native-svg";

const CurvedView = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Content Above Curve</Text>
      <View style={styles.curvedContainer}>
        <Svg height="100%" width="100%" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <Path
            fill="#0099ff"
            d="M0,192L60,192C120,192,240,192,360,181.3C480,171,600,149,720,160C840,171,960,213,1080,229.3C1200,245,1320,235,1380,229.3L1440,224L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
          />
        </Svg>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  curvedContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 150, // Adjust height as needed
  },
  text: {
    fontSize: 20,
    color: "#333",
    marginBottom: 200, // To push it up for the curved view
  },
});

export default CurvedView;
