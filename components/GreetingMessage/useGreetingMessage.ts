// import { useEffect, useState } from "react";
// import * as SecureStore from "expo-secure-store";
// import { useLazyFetchGreetingMessageQuery } from "@/redux/features/cartSlice";
// import { getTimeOfDay } from "@/utils/huggingface";

// const CACHE_DURATION = 5 *60 * 1000; // 10 seconds

// function getGreetingCacheKey(main: string, description: string) {
//   return `GREETING_${main}_${description}`.toUpperCase()?.replace(/ /g, "_");
// }

// type Weather = {
//   main: string;
//   description: string;
// };

// export function useWeatherGreetingMessage(weather: Weather | null) {
//   const [greeting, setGreeting] = useState<string>("");
//   const [fetchGreetingMessage] = useLazyFetchGreetingMessageQuery();

//   useEffect(() => {
//     if (!weather?.main || !weather?.description) return;

//     const key = getGreetingCacheKey(weather.main, weather.description);

//     (async () => {
//       try {
//         const now = Date.now();
//         const cached = await SecureStore.getItemAsync(key);

//         if (cached) {
//           const { text, timestamp } = JSON.parse(cached);
//           const age = now - timestamp;

//         //console.log(`🧠 Greeting cache found (${key}), age: ${age}ms`);

//           if (age < CACHE_DURATION) {
//             //console.log("✅ Using cached greeting");
//             setGreeting(text);
//             return;
//           } else {
//             //console.log("⌛ Greeting cache expired");
//           }
//         } else {
//           //console.log("📭 No cached greeting");
//         }

//         // Generate prompt
//         const prompt = `You're a friendly assistant in a mobile shopping app. Based on the current weather described as "${weather.description}" (${weather.main}) and the time of day "${getTimeOfDay()}", generate a warm and cheerful 1-line greeting message to welcome the user.
// It should feel casual and human, mention the weather naturally, and subtly encourage browsing the shop. Keep it short and mobile-friendly. Return only one sentence. Avoid phrases like "Welcome to the app" or "Here's the forecast." add emojis. It must be in Hinglish.`;

//         //console.log("🤖 Sending prompt:", prompt);

//         const result = await fetchGreetingMessage(
//           { body: JSON.stringify({ prompt }) },
//           true
//         ).unwrap();

//         const raw = result?.text?.trim()?.replace(/^"|"$/g, "") || "";
//         const cleanText = raw.replace(/[\r\n]+/g, " ").replace(/\s\s+/g, " ").trim();

//         setGreeting(cleanText);
//         //console.log("💬 Received greeting:", cleanText);

//         await SecureStore.setItemAsync(
//           key,
//           JSON.stringify({ text: cleanText, timestamp: now })
//         );
//         //console.log("💾 Greeting cached");
//       } catch (err) {
//         console.error("❌ Failed to fetch AI greeting", err);
//       }
//     })();
//   }, [weather]);

//   return greeting;
// }





import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import {
  useLazyFetchCartQuery,
  useLazyFetchGreetingMessageQuery,
} from "@/redux/features/cartSlice";
import { getTimeOfDay } from "@/utils/huggingface";
import { RootState } from "@/types/global";
import { buildGreetingPrompt } from "./buildGreetingPrompt";
import * as SecureStore from "expo-secure-store";

const DEFAULT_WELCOME_MESSAGE = "Your one-stop shop for everything you love.";
const FALLBACK_MESSAGE_GENERIC = "Hey there! Let’s find you something awesome today.";
const FALLBACK_MESSAGE_AFTER_GENERATE = "Welcome back! Ready to discover something new?";
const SECURE_CACHE_KEY = "greeting_cache_v1";
const CACHE_EXPIRY_MINUTES = 1 * 60;

export const useGreetingMessage = () => {
  const userId = useSelector((state: RootState) => state.auth?.userData?._id);
  const recentlyViewed = useSelector(
    (state: RootState) => state?.recentlyViewed?.items
  );

  const [fetchCartData] = useLazyFetchCartQuery();
  const [fetchGreetingMessage] = useLazyFetchGreetingMessageQuery();

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const DEBOUNCE_DELAY = 500;

  const hashPrompt = (prompt: string) => prompt.trim();

  const fetchAndGenerateGreeting = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const cartRes = await fetchCartData({ userId }, true).unwrap();
      const cartItems =
        cartRes?.cart?.items
          ?.map((i) => i?.productDetails?.name)
          .filter(Boolean)
          .slice(0, 3) || [];

      const viewedItems = recentlyViewed?.length
        ? recentlyViewed
            .map((i) => i?.name)
            .filter(Boolean)
            .slice(0, 3)
        : [];

      const prompt = buildGreetingPrompt({
        cartItems,
        recentlyViewedItems: viewedItems,
        timeOfDay: getTimeOfDay(),
      });

      const promptHash = hashPrompt(prompt);

      // Read from SecureStore
      const cachedString = await SecureStore.getItemAsync(SECURE_CACHE_KEY);
      if (cachedString) {
        const cached = JSON.parse(cachedString);
        const isSamePrompt = cached.promptHash === promptHash;
        const isFresh =
          Date.now() - cached.timestamp < CACHE_EXPIRY_MINUTES * 60 * 1000;

        if (isSamePrompt && isFresh) {
          setMessage(cached.text);
          setLoading(false);
          return cached.text;
        }
      }

      // Call API
      const result = await fetchGreetingMessage({ body: JSON.stringify({ prompt }) }, true).unwrap();

      const cleanText =
        result?.text?.trim()?.replace(/^"|"$/g, "") || FALLBACK_MESSAGE_AFTER_GENERATE;

      setMessage(cleanText);

      // Save to SecureStore
      await SecureStore.setItemAsync(
        SECURE_CACHE_KEY,
        JSON.stringify({
          promptHash,
          text: cleanText,
          timestamp: Date.now(),
        })
      );
      return cleanText;
    } catch (error) {
      setMessage(FALLBACK_MESSAGE_GENERIC);
      return FALLBACK_MESSAGE_GENERIC;
    } finally {
      setLoading(false);
    }
  }, [userId, recentlyViewed, fetchCartData, fetchGreetingMessage]);

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      // fetchAndGenerateGreeting(); // Call manually where needed
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [fetchAndGenerateGreeting]);

  return useMemo(
    () => ({
      message,
      loading,
      fetchAndGenerateGreeting,
    }),
    [message, loading, fetchAndGenerateGreeting]
  );
};
