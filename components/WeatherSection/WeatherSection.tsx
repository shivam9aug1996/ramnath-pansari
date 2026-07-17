import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { useSelector } from "react-redux";
import WeatherIcon from "./WeatherIcon";
import { useWeatherInfo } from "./useWeatherInfo";
import { useBatchGreetings } from "../GreetingMessage/useBatchGreetings";
import {
  buildActiveOrderBanner,
  buildActiveOrderItemsBanner,
  buildPersonalizedHomeBanner,
} from "../GreetingMessage/personalizedGreeting";
import { activeOrdersFingerprint } from "../GreetingMessage/buildGreetingPrompt";
import { useIsFocused } from "expo-router";
import { RootState } from "@/types/global";
import { useFetchAddressQuery } from "@/redux/features/addressSlice";
import { useFetchActiveDeliveriesQuery } from "@/redux/features/orderSlice";
import {
  ACTIVE_FLOAT_STATUS_QUERY,
  type ActiveFloatOrder,
} from "@/utils/activeOrderFloat";

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

const WeatherSection = () => {
  const { fetchWeather } = useWeatherInfo();
  const { fetchBatchGreetings } = useBatchGreetings();
  const isFocused = useIsFocused();

  const userData = useSelector((state: RootState) => state.auth?.userData);
  const userId = userData?._id;
  const isGuest = Boolean(userData?.isGuestUser);

  const { data: addresses } = useFetchAddressQuery(
    { userId },
    { skip: !userId || isGuest },
  );

  // Same query as ActiveDeliveryFloat — RTK cache shared.
  // Invalidated by useOrderStatusListener on Firebase status changes.
  const { data: activeDeliveries } = useFetchActiveDeliveriesQuery(
    {
      userId,
      status: ACTIVE_FLOAT_STATUS_QUERY,
      limit: 20,
      page: 1,
    },
    { skip: !userId || isGuest },
  );

  const activeOrders = useMemo(
    () => (activeDeliveries?.orders ?? []) as ActiveFloatOrder[],
    [activeDeliveries?.orders],
  );

  const orderFingerprint = useMemo(
    () => activeOrdersFingerprint(activeOrders),
    [activeOrders],
  );

  const locality = useMemo(() => {
    const primary = addresses?.[0];
    return primary?.colonyArea || primary?.city || null;
  }, [addresses]);

  const weatherRef = useRef<WeatherBits>(null);
  const aiMessagesRef = useRef<string[]>([]);
  const activeOrdersRef = useRef(activeOrders);
  const orderFingerprintRef = useRef<string | null>(null);

  activeOrdersRef.current = activeOrders;

  const [weatherVersion, setWeatherVersion] = useState(0);
  const [aiVersion, setAiVersion] = useState(0);

  const displayMessages = useMemo(() => {
    return uniqueMessages([
      buildActiveOrderBanner({
        name: userData?.name,
        orders: activeOrders,
      }),
      buildActiveOrderItemsBanner({
        name: userData?.name,
        orders: activeOrders,
      }),
      buildPersonalizedHomeBanner({
        name: userData?.name,
        locality,
        weatherDescription: weatherRef.current?.description,
        weatherMain: weatherRef.current?.main,
      }),
      ...aiMessagesRef.current,
    ]);
  }, [userData?.name, locality, activeOrders, weatherVersion, aiVersion]);

  const hasLoadedRef = useRef(false);
  const inFlightRef = useRef(false);
  const fetchWeatherRef = useRef(fetchWeather);
  const fetchBatchRef = useRef(fetchBatchGreetings);

  fetchWeatherRef.current = fetchWeather;
  fetchBatchRef.current = fetchBatchGreetings;

  const refreshAi = useCallback(async (forceRefresh: boolean) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      const aiMessages = await fetchBatchRef.current({
        weather: weatherRef.current,
        activeOrders: activeOrdersRef.current,
        forceRefresh,
      });
      aiMessagesRef.current = uniqueMessages(aiMessages);
      setAiVersion((v) => v + 1);
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  const load = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      const weatherData = await fetchWeatherRef.current();
      weatherRef.current = {
        description: weatherData?.description,
        main: weatherData?.main,
      };
      setWeatherVersion((v) => v + 1);

      const aiMessages = await fetchBatchRef.current({
        weather: weatherData,
        activeOrders: activeOrdersRef.current,
        forceRefresh: false,
      });
      aiMessagesRef.current = uniqueMessages(aiMessages);
      setAiVersion((v) => v + 1);
      orderFingerprintRef.current = activeOrdersFingerprint(
        activeOrdersRef.current,
      );
      hasLoadedRef.current = true;
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isFocused || hasLoadedRef.current) return;
    void load();
  }, [isFocused, load]);

  // useOrderStatusListener → invalidate activeDeliveries → fingerprint change → LLM again
  useEffect(() => {
    if (!hasLoadedRef.current) return;
    if (orderFingerprintRef.current === orderFingerprint) return;

    orderFingerprintRef.current = orderFingerprint;
    void refreshAi(true);
  }, [orderFingerprint, refreshAi]);

  return (
    <View>
      <WeatherIcon
        key={displayMessages.length}
        messages={displayMessages}
        autoPlay={isFocused}
      />
    </View>
  );
};

export default memo(WeatherSection);
