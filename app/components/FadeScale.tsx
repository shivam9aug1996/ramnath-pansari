import React, { useEffect, useRef } from "react";
import { Animated, View, Text, Button } from "react-native";

const FadeScale = ({ visible, children }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      // Mount animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Unmount animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }}
    >
      {children}
    </Animated.View>
  );
};

export default function Demo() {
  const [show, setShow] = React.useState(true);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Button title="Toggle" onPress={() => setShow((prev) => !prev)} />

      {/** Keep mounted always, but animate hide/show */}
      <FadeScale visible={show}>
        <View
          style={{
            width: 200,
            height: 100,
            backgroundColor: "tomato",
            justifyContent: "center",
            alignItems: "center",
            borderRadius: 10,
            marginTop: 20,
          }}
        >
          <Text style={{ color: "white" }}>Cart Section</Text>
        </View>
      </FadeScale>
    </View>
  );
}
