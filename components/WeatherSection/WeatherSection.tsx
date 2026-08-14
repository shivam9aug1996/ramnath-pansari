import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InteractionManager, StyleSheet, View } from "react-native";
import { useSelector } from "react-redux";
import { useIsFocused } from "expo-router";

import WeatherIcon from "./WeatherIcon";
import { WEATHER_SLOT_HEIGHT } from "./weatherLayout";
import { useWeatherInfo } from "./useWeatherInfo";
import { useBatchGreetings } from "../GreetingMessage/useBatchGreetings";
import {
  buildActiveOrderBanner,
  buildActiveOrderItemsBanner,
  buildPersonalizedHomeBanner,
} from "../GreetingMessage/personalizedGreeting";
import { activeOrdersFingerprint } from "../GreetingMessage/buildGreetingPrompt";
import { RootState } from "@/types/global";
import { useFetchActiveDeliveriesQuery } from "@/redux/features/orderSlice";
import {
  ACTIVE_FLOAT_STATUS_QUERY,
  type ActiveFloatOrder,
} from "@/utils/activeOrderFloat";

/** Delay execution until home screen first-paint settles. */
const WEATHER_SIDE_EFFECT_DELAY_MS = 400;

function uniqueMessages(messages: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const message of messages) {
    const text = message?.trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    result.push(text);
  }

  return result;
}

type WeatherBits = {
  description?: string;
  main?: string;
} | null;

type WeatherAndAiState = {
  weather: WeatherBits;
  aiMessages: string[];
};

const WeatherSection = () => {
  const { fetchWeather } = useWeatherInfo();
  const { fetchBatchGreetings } = useBatchGreetings();
  const isFocused = useIsFocused();
  const [sideEffectsReady, setSideEffectsReady] = useState(false);

  const userId = useSelector((state: RootState) => state.auth?.userData?._id);
  const userName = useSelector((state: RootState) => state.auth?.userData?.name);
  const isGuest = useSelector((state: RootState) =>
    Boolean(state.auth?.userData?.isGuestUser),
  );

  // Shared active orders query
  const { data: activeDeliveries } = useFetchActiveDeliveriesQuery(
    {
      userId,
      status: ACTIVE_FLOAT_STATUS_QUERY,
      limit: 20,
      page: 1,
    },
    { skip: !userId || isGuest || !sideEffectsReady },
  );

  const activeOrders = useMemo(
    () => (activeDeliveries?.orders ?? []) as ActiveFloatOrder[],
    [activeDeliveries?.orders],
  );

  const orderFingerprint = useMemo(
    () => activeOrdersFingerprint(activeOrders),
    [activeOrders],
  );

  // Combined state object to avoid multiple set-state loops on fetch completion
  const [weatherAndAi, setWeatherAndAi] = useState<WeatherAndAiState>({
    weather: null,
    aiMessages: [],
  });

  const activeOrdersRef = useRef(activeOrders);
  activeOrdersRef.current = activeOrders;

  const orderFingerprintRef = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);
  const inFlightRef = useRef(false);

  const fetchWeatherRef = useRef(fetchWeather);
  const fetchBatchRef = useRef(fetchBatchGreetings);
  fetchWeatherRef.current = fetchWeather;
  fetchBatchRef.current = fetchBatchGreetings;

  const displayMessages = useMemo(() => {
    return uniqueMessages([
      buildActiveOrderBanner({
        name: userName,
        orders: activeOrders,
      }),
      buildActiveOrderItemsBanner({
        name: userName,
        orders: activeOrders,
      }),
      buildPersonalizedHomeBanner({
        name: userName,
        weatherDescription: weatherAndAi.weather?.description,
        weatherMain: weatherAndAi.weather?.main,
      }),
      ...weatherAndAi.aiMessages,
    ]);
  }, [userName, activeOrders, weatherAndAi]);

  const refreshAi = useCallback(async (forceRefresh: boolean) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      const aiMessages = await fetchBatchRef.current({
        weather: weatherAndAi.weather,
        activeOrders: activeOrdersRef.current,
        forceRefresh,
      });

      setWeatherAndAi((prev) => ({
        ...prev,
        aiMessages: uniqueMessages(aiMessages),
      }));
    } finally {
      inFlightRef.current = false;
    }
  }, [weatherAndAi.weather]);

  const load = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      const weatherData = await fetchWeatherRef.current();
      const weatherBits = {
        description: weatherData?.description,
        main: weatherData?.main,
      };

      const aiMessages = await fetchBatchRef.current({
        weather: weatherData,
        activeOrders: activeOrdersRef.current,
        forceRefresh: false,
      });

      setWeatherAndAi({
        weather: weatherBits,
        aiMessages: uniqueMessages(aiMessages),
      });

      orderFingerprintRef.current = activeOrdersFingerprint(
        activeOrdersRef.current,
      );
      hasLoadedRef.current = true;
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  // Defer heavy side effects until screen transitions / initial paints finish
  useEffect(() => {
    if (!isFocused) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const task = InteractionManager.runAfterInteractions(() => {
      timer = setTimeout(() => {
        if (!cancelled) setSideEffectsReady(true);
      }, WEATHER_SIDE_EFFECT_DELAY_MS);
    });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      task.cancel();
    };
  }, [isFocused]);

  // Initial load after side-effects readiness signal
  useEffect(() => {
    if (!isFocused || !sideEffectsReady || hasLoadedRef.current) return;
    void load();
  }, [isFocused, sideEffectsReady, load]);

  // Handle active order updates
  useEffect(() => {
    if (!hasLoadedRef.current) return;
    if (orderFingerprintRef.current === orderFingerprint) return;

    orderFingerprintRef.current = orderFingerprint;
    void refreshAi(true);
  }, [orderFingerprint, refreshAi]);

  return (
    <View style={styles.container}>
      <WeatherIcon messages={displayMessages} autoPlay={isFocused} />
    </View>
  );
};

export default memo(WeatherSection);

const styles = StyleSheet.create({
  container: {
    height: WEATHER_SLOT_HEIGHT,
    overflow: "hidden",
  },
});