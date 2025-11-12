import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { useLazyFetchGreetingMessageQuery } from "@/redux/features/cartSlice";
import { getTimeOfDay } from "@/utils/huggingface";

const CACHE_DURATION = 60 * 60 * 1000; 
const FALLBACK_MESSAGE_GENERIC = "🚀 Fast delivery. Reliable service. Everything you need at your doorstep.";

const key = "GREETING_CACHE_KEY";

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

      //console.log(`🧠 Greeting cache found (${key}), age: ${age}ms`);

        if (age < CACHE_DURATION) {
          //console.log("✅ Using cached greeting");
          setGreeting(text);
          return text;
        } else {
          //console.log("⌛ Greeting cache expired");
        }
      } else {
        //console.log("📭 No cached greeting");
      }

      // Generate prompt
      const prompt = `You're a friendly assistant in a mobile shopping app. Based on the current weather described as "${weather.description}" (${weather.main}) and the time of day "${getTimeOfDay()}", generate a warm and cheerful 1-line greeting message to welcome the user.
It should feel casual and human, mention the weather naturally, and subtly encourage browsing the shop. Keep it short and mobile-friendly. Return only one sentence. Avoid phrases like "Welcome to the app" or "Here's the forecast." add emojis. It must be in Hinglish.`;

      //console.log("🤖 Sending prompt:", prompt);

      const result = await fetchGreetingMessage(
        { body: JSON.stringify({ prompt }) },
        true
      ).unwrap();

      const raw = result?.text?.trim()?.replace(/^"|"$/g, "") || "";
      const cleanText = raw?.replace(/[\r\n]+/g, " ")?.replace(/\s\s+/g, " ")?.trim() || FALLBACK_MESSAGE_GENERIC;

      setGreeting(cleanText);
      //console.log("💬 Received greeting:", cleanText);

      await SecureStore.setItemAsync(
        key,
        JSON.stringify({ text: cleanText, timestamp: now })
      );
      return cleanText;
      //console.log("💾 Greeting cached");
    } catch (err) {
      console.error("❌ Failed to fetch AI greeting", err);
      setGreeting(FALLBACK_MESSAGE_GENERIC);
      return FALLBACK_MESSAGE_GENERIC;
    }
  }

  return {greeting,fetchGreeting};
}
