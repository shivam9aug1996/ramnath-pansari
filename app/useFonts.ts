import { useFonts as useExpoFonts, FontDisplay } from "expo-font";
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

const withSwap = (uri: number) => ({
  uri,
  display: FontDisplay.SWAP,
});

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
};

export const useFonts = () => {
  // Server/static export: {} → no <link rel="preload" as="font">.
  // Client: load custom fonts; font-display:swap keeps system text visible first.
  return useExpoFonts(typeof window === "undefined" ? {} : ALL_FONTS);
};
