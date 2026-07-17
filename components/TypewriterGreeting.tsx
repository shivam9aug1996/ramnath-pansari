import React, { memo, useEffect, useMemo } from "react";
import { StyleSheet, TextStyle, View } from "react-native";
import { Image } from "expo-image";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { Colors } from "@/constants/Colors";
import { buildTypewriterLines } from "@/components/GreetingMessage/personalizedGreeting";

const MAX_CHARS = 22;
const CHAR_MS = 45;
const HOLD_MS = 1200;

const BRAND = "Ramnath Pansari";
const brandIcon = require("@/assets/images/icon2.png");

function clipOneLine(text: string, max = MAX_CHARS) {
  const normalized = text.trim().replace(/\s+/g, " ");

  if (normalized.length <= max) {
    return normalized;
  }

  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

type CharProps = {
  char: string;
  index: number;
  start?: number;
  textStyle?: TextStyle;
};

const TypeChar = memo(
  ({ char, index, start = 0, textStyle }: CharProps) => {
    const opacity = useSharedValue(0);

    useEffect(() => {
      opacity.value = 0;

      opacity.value = withDelay(
        start + index * CHAR_MS,
        withTiming(1, {
          duration: 80,
          easing: Easing.out(Easing.quad),
        }),
      );
    }, [char, index, opacity, start]);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
    }));

    return (
      <Animated.Text style={[textStyle, animatedStyle]}>
        {char === " " ? "\u00A0" : char}
      </Animated.Text>
    );
  },
);

TypeChar.displayName = "TypeChar";

type TypewriterGreetingProps = {
  userName?: string | null;
  locality?: string | null;
  hasActiveDelivery?: boolean;
  style?: TextStyle;
};

const TypewriterGreeting = memo(
  ({ userName, style }: TypewriterGreetingProps) => {
    const lines = useMemo(() => {
      const first = userName?.trim().split(/\s+/)[0] || "there";
      return [
        clipOneLine(`Hey ${first}`),
        clipOneLine("Ready to shop?"),
        BRAND,
      ];
    }, [userName]);

    const [lineIndex, setLineIndex] = React.useState(0);

    const line = lines[lineIndex] ?? "";
    const isBrand = lineIndex === lines.length - 1;

    const chars = useMemo(() => line.split(""), [line]);

    useEffect(() => {
      setLineIndex(0);
    }, [lines[0], lines[1]]);

    useEffect(() => {
      const typingDuration = line.length * CHAR_MS + 80;

      const timeout = setTimeout(() => {
        if (lineIndex < lines.length - 1) {
          setLineIndex((prev) => prev + 1);
        }
      }, typingDuration + HOLD_MS);

      return () => clearTimeout(timeout);
    }, [line.length, lineIndex, lines.length]);

    return (
      <View style={styles.wrap}>
        <View style={[styles.row, isBrand && styles.brandRow]}>
          {isBrand && (
            <Image
              source={brandIcon}
              style={styles.logo}
              contentFit="contain"
            />
          )}

          <View style={styles.chars}>
            {chars.map((char, index) => (
              <TypeChar
                key={`${lineIndex}-${index}`}
                char={char}
                index={index}
                textStyle={StyleSheet.flatten([
                  isBrand ? styles.brandText : styles.text,
                  style,
                ])}
              />
            ))}
          </View>
        </View>
      </View>
    );
  },
);

TypewriterGreeting.displayName = "TypewriterGreeting";

const styles = StyleSheet.create({
  wrap: {
    minHeight: 45,
    justifyContent: "center",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  brandRow: {
    gap: 8,
  },

  chars: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
  },

  text: {
    fontFamily: "Raleway_800ExtraBold",
    fontSize: 22,
    color: Colors.light.darkGreen,
  },

  brandText: {
    fontFamily: "Raleway_800ExtraBold",
    fontSize: 18,
    color: Colors.light.darkGreen,
  },

  logo: {
    width: 45,
    height: 45,
    borderRadius: 6,
  },
});

export default TypewriterGreeting;
