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

export const useFonts = () => {
  return useExpoFonts({
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
  });
};