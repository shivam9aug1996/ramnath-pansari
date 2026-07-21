import { useCallback, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  useLazyFetchCartQuery,
  useLazyFetchGreetingMessageQuery,
} from "@/redux/features/cartSlice";
import { useLazyFetchOrdersQuery } from "@/redux/features/orderSlice";
import { getTimeOfDay } from "@/utils/huggingface";
import { RootState } from "@/types/global";
import {
  hashGreetingRequest,
  type StructuredGreetingBody,
} from "./buildGreetingPrompt";
import { sanitizeGreeting } from "./sanitizeGreeting";
import { storage } from "@/utils/storage";
import { StorageKeys } from "@/utils/storageKeys";
import { devLog } from "@/utils/devLog";
import type { ActiveFloatOrder } from "@/utils/activeOrderFloat";
import { OrderStatus } from "@/constants/Order";

const WEATHER_FALLBACK =
  "Fast delivery. Reliable service. Everything you need at your doorstep.";
const CART_FALLBACK = "Welcome back! Ready to discover something new?";
const CACHE_DURATION_MS = 60 * 60 * 1000;
const CACHE_KEY = StorageKeys.greetingCacheV2;

type WeatherInput = {
  main?: string;
  description?: string;
} | null;

type OrderWithProducts = {
  productNames?: string[];
};

export type BatchGreetingContext = {
  weather?: WeatherInput;
  activeOrders?: ActiveFloatOrder[];
  /** Skip local cache and force a fresh LLM call (e.g. status change). */
  forceRefresh?: boolean;
};

function uniqueNames(names: Array<string | undefined | null>, max = 5): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const name of names) {
    const text = name?.trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    result.push(text);
    if (result.length >= max) break;
  }
  return result;
}

function resolveActiveOrderStatus(orders: ActiveFloatOrder[] | undefined): string {
  if (!orders?.length) return "none";
  const delivering = orders.some(
    (order) =>
      order.orderStatus?.toLowerCase() === OrderStatus.OUT_FOR_DELIVERY,
  );
  if (delivering) return OrderStatus.OUT_FOR_DELIVERY;
  return OrderStatus.CONFIRMED;
}

export function useBatchGreetings() {
  const userId = useSelector((state: RootState) => state.auth?.userData?._id);
  const recentlyViewed = useSelector(
    (state: RootState) => state?.recentlyViewed?.items,
  );
  const isGuestUser = useSelector((s) => s.auth?.userData?.isGuestUser);


  const [fetchCartData] = useLazyFetchCartQuery();
  const [fetchOrders] = useLazyFetchOrdersQuery();
  const [fetchGreetingMessage] = useLazyFetchGreetingMessageQuery();
  const [loading, setLoading] = useState(false);

  const fetchBatchGreetings = useCallback(
    async (context: BatchGreetingContext = {}): Promise<string[]> => {
      const { weather, activeOrders, forceRefresh = false } = context;
      setLoading(true);

      try {
        let cartItems: string[] = [];
        let orderedItems: string[] = [];

        if (userId && !isGuestUser) {
          const [cartSettled, ordersSettled] = await Promise.allSettled([
            fetchCartData({ userId }, true).unwrap(),
            fetchOrders({ userId, page: 1, limit: 5 }, true).unwrap(),
          ]);

          if (cartSettled.status === "fulfilled") {
            cartItems =
              cartSettled.value?.cart?.items
                ?.map((i: { productDetails?: { name?: string } }) =>
                  i?.productDetails?.name,
                )
                .filter(Boolean)
                .slice(0, 3) || [];
          }

          if (ordersSettled.status === "fulfilled") {
            const orders = (ordersSettled.value?.orders ??
              []) as OrderWithProducts[];
            orderedItems = uniqueNames(
              orders.flatMap((order) => order.productNames ?? []),
              5,
            );
          }
        }

        const viewedItems = recentlyViewed?.length
          ? recentlyViewed
              .map((i) => i?.name)
              .filter(Boolean)
              .slice(0, 3)
          : [];

        const activeOrderedItems = uniqueNames(
          (activeOrders ?? []).flatMap((order) => order.productNames ?? []),
          5,
        );

        const body: StructuredGreetingBody = {
          type: "batch",
          payload: {
            timeOfDay: getTimeOfDay(),
            weatherDescription: weather?.description,
            weatherMain: weather?.main,
            cartItems,
            recentlyViewedItems: viewedItems,
            orderedItems,
            activeOrderStatus: resolveActiveOrderStatus(activeOrders),
            activeOrderedItems,
          },
        };
        const requestHash = hashGreetingRequest(body);

        if (!forceRefresh) {
          const cachedString = await storage.getItem(CACHE_KEY);
          if (cachedString) {
            const cached = JSON.parse(cachedString);
            const isSame = cached.requestHash === requestHash;
            const isFresh =
              Date.now() - cached.timestamp < CACHE_DURATION_MS;

            if (isSame && isFresh && Array.isArray(cached.messages)) {
              return cached.messages.map((text: string) =>
                sanitizeGreeting(text, CART_FALLBACK),
              );
            }
          }
        }

        const result = await fetchGreetingMessage(body, true).unwrap();
        const weatherText = sanitizeGreeting(
          result?.weather ?? result?.messages?.[0],
          WEATHER_FALLBACK,
        );
        const cartText = sanitizeGreeting(
          result?.cart ?? result?.messages?.[1],
          CART_FALLBACK,
        );
        const messages = [weatherText, cartText];

        await storage.setItem(
          CACHE_KEY,
          JSON.stringify({
            requestHash,
            messages,
            timestamp: Date.now(),
          }),
        );

        return messages;
      } catch (err) {
        devLog("Failed to fetch batch greetings", err);
        return [WEATHER_FALLBACK, CART_FALLBACK];
      } finally {
        setLoading(false);
      }
    },
    [
      userId,
      isGuestUser,
      recentlyViewed,
      fetchCartData,
      fetchOrders,
      fetchGreetingMessage,
    ],
  );

  return useMemo(
    () => ({ loading, fetchBatchGreetings }),
    [loading, fetchBatchGreetings],
  );
}
