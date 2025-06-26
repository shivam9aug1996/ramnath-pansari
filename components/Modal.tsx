import { Link } from "expo-router";
import { useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";

export default function Modal() {
  const [isOpen, setIsOpen] = useState(false);
  if (isOpen) {
    return (
      <Animated.View
        entering={FadeIn}
        style={[
          {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#00000040",
            zIndex: 2,
          },
          StyleSheet.absoluteFillObject,
        ]}
      >
        <Pressable
          onPress={() => {
            setIsOpen(false);
          }}
          style={[StyleSheet.absoluteFill]}
        />

        <Animated.View
          entering={SlideInDown}
          style={{
            width: "90%",
            height: "40%",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "white",
          }}
        >
          <Text style={{ fontWeight: "bold", marginBottom: 10 }}>
            Modal Screen
          </Text>
        </Animated.View>
      </Animated.View>
    );
  } else {
    return (
      <Pressable
        onPress={() => {
          setIsOpen(true);
        }}
      >
        <Text>Open</Text>
      </Pressable>
    );
  }
}
