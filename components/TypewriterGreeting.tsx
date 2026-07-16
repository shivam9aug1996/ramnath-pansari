import React, { memo, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View, type TextStyle } from "react-native";
import { Image } from "expo-image";
import { Colors } from "@/constants/Colors";

const MAX_CHARS = 22;
const CHAR_MS = 45;
const HOLD_MS = 1200;
const BRAND = "Ramnath Pansari";
const brandIcon = require("@/assets/images/icon2.png");

function clipOneLine(text: string, max = MAX_CHARS) {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function useTypewriterOnce(
  lines: string[],
  charMs = CHAR_MS,
  holdMs = HOLD_MS,
) {
  const [lineIndex, setLineIndex] = useState(0);
  const [visible, setVisible] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!lines.length || done) return;

    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout>;
    const line = lines[lineIndex] ?? "";
    let i = 0;
    setVisible("");

    const tick = () => {
      if (cancelled) return;
      if (i <= line.length) {
        setVisible(line.slice(0, i));
        i += 1;
        timeout = setTimeout(tick, charMs);
        return;
      }

      if (lineIndex >= lines.length - 1) {
        setDone(true);
        return;
      }

      timeout = setTimeout(() => {
        if (!cancelled) setLineIndex((n) => n + 1);
      }, holdMs);
    };

    tick();
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [lineIndex, lines, charMs, holdMs, done]);

  return { visible, lineIndex, done };
}

type TypewriterGreetingProps = {
  userName?: string | null;
  style?: TextStyle;
};

const TypewriterGreeting = memo(function TypewriterGreeting({
  userName,
  style,
}: TypewriterGreetingProps) {
  const lines = useMemo(() => {
    return [
      clipOneLine(`Hey ${userName?.trim() || "there"}`),
      clipOneLine("Ready to shop?"),
      BRAND,
    ];
  }, [userName]);

  const { visible: typed, lineIndex } = useTypewriterOnce(lines);
  const isBrand = lineIndex === 2;

  return (
    <View style={styles.wrap}>
      {isBrand ? (
        <View style={styles.brandRow}>
          <Image source={brandIcon} style={styles.logo} contentFit="contain" />
          <Text style={[styles.brandText, style]} numberOfLines={1}>
            {typed}
          </Text>
        </View>
      ) : (
        <Text style={[styles.text, style]} numberOfLines={1}>
          {typed}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    minHeight: 32,
    justifyContent: "center",
  },
  text: {
    fontFamily: "Raleway_800ExtraBold",
    fontSize: 22,
    color: Colors.light.darkGreen,
    marginBottom: 3,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  brandText: {
    flexShrink: 1,
    fontFamily: "Raleway_800ExtraBold",
    fontSize: 18,
    color: Colors.light.darkGreen,
    marginBottom: 3,
  },
});

export default TypewriterGreeting;