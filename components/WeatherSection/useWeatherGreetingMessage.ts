import { useState } from "react";
import * as SecureStore from "expo-secure-store";
import { useLazyFetchGreetingMessageQuery } from "@/redux/features/cartSlice";
import { getTimeOfDay } from "@/utils/huggingface";
import { buildWeatherGreetingPrompt } from "../GreetingMessage/buildGreetingPrompt";
import { sanitizeGreeting } from "../GreetingMessage/sanitizeGreeting";

const CACHE_DURATION = 60 * 60 * 1000;
const FALLBACK_MESSAGE_GENERIC =
  "Fast delivery. Reliable service. Everything you need at your doorstep.";

const key = "GREETING_WEATHER_CACHE_V2";

type Weather = {
  main: string;
  description: string;
};

export function useWeatherGreetingMessage() {
  const [greeting, setGreeting] = useState<string>("");
  const [fetchGreetingMessage] = useLazyFetchGreetingMessageQuery();

  const fetchGreeting = async (weather: Weather) => {
    try {
      const now = Date.now();
      const cached = await SecureStore.getItemAsync(key);

      if (cached) {
        const { text, timestamp } = JSON.parse(cached);
        const age = now - timestamp;

        if (age < CACHE_DURATION) {
          const cachedText = sanitizeGreeting(text, FALLBACK_MESSAGE_GENERIC);
          setGreeting(cachedText);
          return cachedText;
        }
      }

      const prompt = buildWeatherGreetingPrompt({
        weatherDescription: weather.description,
        weatherMain: weather.main,
        timeOfDay: getTimeOfDay(),
      });

      const result = await fetchGreetingMessage(
        { body: JSON.stringify({ prompt }) },
        true,
      ).unwrap();

      const cleanText = sanitizeGreeting(result?.text, FALLBACK_MESSAGE_GENERIC);

      setGreeting(cleanText);

      await SecureStore.setItemAsync(
        key,
        JSON.stringify({ text: cleanText, timestamp: now }),
      );
      return cleanText;
    } catch (err) {
      console.error("Failed to fetch AI greeting", err);
      setGreeting(FALLBACK_MESSAGE_GENERIC);
      return FALLBACK_MESSAGE_GENERIC;
    }
  };

  return { greeting, fetchGreeting };
}
