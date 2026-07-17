import { useState } from "react";
import { devLog } from "@/utils/devLog";
import { useLazyFetchGreetingMessageQuery } from "@/redux/features/cartSlice";
import { getTimeOfDay } from "@/utils/huggingface";
import {
  hashGreetingRequest,
  type StructuredGreetingBody,
} from "../GreetingMessage/buildGreetingPrompt";
import { sanitizeGreeting } from "../GreetingMessage/sanitizeGreeting";
import { storage } from "@/utils/storage";

const CACHE_DURATION = 60 * 60 * 1000;
const FALLBACK_MESSAGE_GENERIC =
  "Fast delivery. Reliable service. Everything you need at your doorstep.";

const key = "GREETING_WEATHER_CACHE_V3";

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
      const body: StructuredGreetingBody = {
        type: "weather",
        payload: {
          weatherDescription: weather.description,
          weatherMain: weather.main,
          timeOfDay: getTimeOfDay(),
        },
      };
      const requestHash = hashGreetingRequest(body);

      const cached = await storage.getItem(key);
      if (cached) {
        const parsed = JSON.parse(cached);
        const age = now - parsed.timestamp;
        const sameRequest = parsed.requestHash === requestHash;

        if (sameRequest && age < CACHE_DURATION) {
          const cachedText = sanitizeGreeting(
            parsed.text,
            FALLBACK_MESSAGE_GENERIC,
          );
          setGreeting(cachedText);
          return cachedText;
        }
      }

      const result = await fetchGreetingMessage(body, true).unwrap();
      const cleanText = sanitizeGreeting(
        result?.text,
        FALLBACK_MESSAGE_GENERIC,
      );

      setGreeting(cleanText);
      await storage.setItem(
        key,
        JSON.stringify({
          requestHash,
          text: cleanText,
          timestamp: now,
        }),
      );
      return cleanText;
    } catch (err) {
      devLog("Failed to fetch AI greeting", err);
      setGreeting(FALLBACK_MESSAGE_GENERIC);
      return FALLBACK_MESSAGE_GENERIC;
    }
  };

  return { greeting, fetchGreeting };
}
