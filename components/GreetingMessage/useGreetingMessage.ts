import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import {
  useLazyFetchCartQuery,
  useLazyFetchGreetingMessageQuery,
} from "@/redux/features/cartSlice";
import { getTimeOfDay } from "@/utils/huggingface";
import { RootState } from "@/types/global";
import {
  hashGreetingRequest,
  type StructuredGreetingBody,
} from "./buildGreetingPrompt";
import { sanitizeGreeting } from "./sanitizeGreeting";
import { storage } from "@/utils/storage";
import { StorageKeys } from "@/utils/storageKeys";

const FALLBACK_MESSAGE_GENERIC =
  "Hey there! Let’s find you something awesome today.";
const FALLBACK_MESSAGE_AFTER_GENERATE =
  "Welcome back! Ready to discover something new?";
const CACHE_EXPIRY_MINUTES = 1 * 60;

export const useGreetingMessage = () => {
  const userId = useSelector((state: RootState) => state.auth?.userData?._id);
  const recentlyViewed = useSelector(
    (state: RootState) => state?.recentlyViewed?.items,
  );

  const [fetchCartData] = useLazyFetchCartQuery();
  const [fetchGreetingMessage] = useLazyFetchGreetingMessageQuery();

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const DEBOUNCE_DELAY = 500;

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

      const body: StructuredGreetingBody = {
        type: "cart",
        payload: {
          cartItems,
          recentlyViewedItems: viewedItems,
          timeOfDay: getTimeOfDay(),
        },
      };
      const requestHash = hashGreetingRequest(body);

      const cachedString = await storage.getItem(StorageKeys.greetingCacheV2);

      if (cachedString) {
        const cached = JSON.parse(cachedString);
        const isSameRequest =
          cached.requestHash === requestHash ||
          cached.promptHash === requestHash;
        const isFresh =
          Date.now() - cached.timestamp < CACHE_EXPIRY_MINUTES * 60 * 1000;

        if (isSameRequest && isFresh) {
          const cachedText = sanitizeGreeting(
            cached.text,
            FALLBACK_MESSAGE_AFTER_GENERATE,
          );
          setMessage(cachedText);
          setLoading(false);
          return cachedText;
        }
      }

      const result = await fetchGreetingMessage(body, true).unwrap();

      const cleanText = sanitizeGreeting(
        result?.text,
        FALLBACK_MESSAGE_AFTER_GENERATE,
      );

      setMessage(cleanText);

      await storage.setItem(
        StorageKeys.greetingCacheV2,
        JSON.stringify({
          requestHash,
          text: cleanText,
          timestamp: Date.now(),
        }),
      );

      return cleanText;
    } catch {
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
    [message, loading, fetchAndGenerateGreeting],
  );
};
