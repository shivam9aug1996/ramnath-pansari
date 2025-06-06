import { Text, type TextProps, StyleSheet } from "react-native";

import { useThemeColor } from "@/hooks/useThemeColor";
import { fonts } from "@/constants/Fonts";
import { Colors } from "@/constants/Colors";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?:
    | "regularMedium"
    | "welcomeText"
    | "linkSmall"
    | "title"
    | "screenHeader";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "regularMedium",
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor(
    { light: lightColor, dark: lightColor },
    getTextType(type)
  );

  return (
    <Text
      style={[
        { color },
        type === "regularMedium" ? styles.regularMedium : undefined,
        type === "welcomeText" ? styles.welcomeText : undefined,
        type === "linkSmall" ? styles.linkSmall : undefined,
        type === "title" ? styles.title : undefined,
        type === "screenHeader" ? styles.screenHeader : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const getTextType = (
  type: "regularMedium" | "welcomeText" | "linkSmall" | "title" | "screenHeader"
) => {
  if (type === "regularMedium") {
    return "defaultText";
  } else if (type === "linkSmall") {
    return "linkText";
  } else if (type === "title") {
    return "title";
  }
  return "defaultText";
};

const styles = StyleSheet.create({
  regularMedium: {
    ...(fonts.defaultMedium as any),
  },
  welcomeText: {
    ...(fonts.defaultMedium as any),
    fontSize: 12,
  },
  linkSmall: {
    fontFamily: "Raleway",
    fontSize: 12,
  },
  title: {
    ...(fonts.defaultBold as any),
  },
  screenHeader: {
    fontFamily: "Montserrat_400Regular",
    fontSize: 12,
    color: Colors.light.darkGrey,
  },
});
