import React, { memo, useMemo } from "react";
import { StyleProp, TextStyle } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { fonts } from "@/constants/Fonts";

type Props = {
  text: string;
  style?: StyleProp<TextStyle>;
  lightColor?: string;
};

/** Renders text with Montserrat on any digit runs (phones, dates, etc.). */
function TextWithMontserratDigits({ text, style, lightColor }: Props) {
  const parts = useMemo(() => text.split(/(\d+)/), [text]);

  return (
    <ThemedText lightColor={lightColor} style={style}>
      {parts.map((part, index) =>
        /^\d+$/.test(part) ? (
          <ThemedText
            key={`${index}-${part}`}
            lightColor={lightColor}
            style={[style, fonts.defaultNumber as TextStyle]}
          >
            {part}
          </ThemedText>
        ) : (
          part
        ),
      )}
    </ThemedText>
  );
}

export default memo(TextWithMontserratDigits);
