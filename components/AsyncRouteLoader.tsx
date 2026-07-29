import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Colors } from "@/constants/Colors";

type Props = {
  title?: string;
  message?: string;
  showBrand?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function AsyncRouteLoader({
  title = "Ramnath Pansari",
  message = "Loading…",
  showBrand = true,
  style,
}: Props) {
  const pulse = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    pulseLoop.start();
    spinLoop.start();
    return () => {
      pulseLoop.stop();
      spinLoop.stop();
    };
  }, [pulse, spin]);

  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });
  const ringOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.12],
  });
  const spinRotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View
      style={[styles.screen, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={message}
    >
      <View style={styles.markWrap}>
        <Animated.View
          style={[
            styles.pulseRing,
            { opacity: ringOpacity, transform: [{ scale: ringScale }] },
          ]}
        />
        <Animated.View
          style={[styles.spinnerRing, { transform: [{ rotate: spinRotate }] }]}
        />
        <View style={styles.logoDisc}>
          <Image
            source={{ uri: "/brand-logo.webp" }}
            style={styles.logo}
            resizeMode="cover"
          />
        </View>
      </View>
      {showBrand ? <Text style={styles.title}>{title}</Text> : null}
      <Text style={styles.subtitle}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.softGreen,
    paddingHorizontal: 24,
  },
  markWrap: {
    width: 88,
    height: 88,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  pulseRing: {
    position: "absolute",
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.light.lightGreen,
  },
  spinnerRing: {
    position: "absolute",
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2.5,
    borderColor: Colors.light.softGrey_1,
    borderTopColor: Colors.light.mediumGreen,
    borderRightColor: Colors.light.lightGreen,
  },
  logoDisc: {
    width: 56,
    height: 56,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.light.white,
    shadowColor: Colors.light.darkGreen,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.darkGreen,
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7C72",
    letterSpacing: 0.3,
  },
});
