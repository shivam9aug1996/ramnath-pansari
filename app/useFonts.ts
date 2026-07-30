import { useFonts as useExpoFonts, FontDisplay } from "expo-font";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Feather from "@expo/vector-icons/Feather";
import {
  Raleway_400Regular,
  Raleway_500Medium,
  Raleway_600SemiBold,
  Raleway_700Bold,
  Raleway_800ExtraBold,
} from "@expo-google-fonts/raleway";
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
} from "@expo-google-fonts/montserrat";

const withSwap = (uri: string | number) => ({
  uri,
  display: FontDisplay.SWAP,
});

/** Map `{ family: require(...) }` icon fonts to expo-font resources with font-display:swap. */
function withIconFontSwap(fontMap: Record<string, string | number>) {
  return Object.fromEntries(
    Object.entries(fontMap).map(([family, uri]) => [family, withSwap(uri)]),
  );
}

/** Client-only map. Empty on SSR so static HTML does not preload all .ttf files. */
const ALL_FONTS = {
  Raleway_400Regular: withSwap(Raleway_400Regular),
  Raleway_500Medium: withSwap(Raleway_500Medium),
  Raleway_600SemiBold: withSwap(Raleway_600SemiBold),
  Raleway_700Bold: withSwap(Raleway_700Bold),
  Raleway_800ExtraBold: withSwap(Raleway_800ExtraBold),
  Montserrat_400Regular: withSwap(Montserrat_400Regular),
  Montserrat_500Medium: withSwap(Montserrat_500Medium),
  Montserrat_600SemiBold: withSwap(Montserrat_600SemiBold),
  Montserrat_700Bold: withSwap(Montserrat_700Bold),
  Montserrat_800ExtraBold: withSwap(Montserrat_800ExtraBold),
  // Icon fonts (otherwise load with font-display:auto via @expo/vector-icons)
  ...withIconFontSwap(Ionicons.font),
  ...withIconFontSwap(MaterialIcons.font),
  ...withIconFontSwap(MaterialCommunityIcons.font),
  ...withIconFontSwap(Feather.font),
};

export const useFonts = () => {
  // Server/static export: {} → no <link rel="preload" as="font">.
  // Client: load custom fonts; font-display:swap keeps text/icons visible first.
  const isSsr = typeof window === "undefined";
  return useExpoFonts(isSsr ? {} : ALL_FONTS);
};
