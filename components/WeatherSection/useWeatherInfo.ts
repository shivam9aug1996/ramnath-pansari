import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { fetchLocation } from "./fetchLocation";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/types/global";
import { setError, setHour, setLoading, setWeather } from "@/redux/features/weatherSlice";

const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
const WEATHER_CACHE_KEY = "WEATHER_CACHE";
const CACHE_DURATION = 5 * 60 * 1000;

export function useWeatherInfo() {
  const dispatch = useDispatch();
 const weatherData = useSelector((state: RootState) => state?.weather);
 const hour = weatherData?.hour;
 const loading = weatherData?.loading;
 const error = weatherData?.error;
 const weather = weatherData?.weather;

  const fetchWeather = async () => {
    try {
      //console.log("🌦️ useWeatherInfo hook triggered");
      dispatch(setLoading(true));
      dispatch(setError(null));
      const now = Date.now();

      // 1. Check for cached weather
      const cached = await SecureStore.getItemAsync(WEATHER_CACHE_KEY);
      if (cached) {
        const { timestamp, weather: cachedWeather } = JSON.parse(cached);
        const age = now - timestamp;

        //console.log("🧊 Cached weather age:", age, "ms");

        if (age < CACHE_DURATION) {
          //console.log("✅ Using cached weather");
          dispatch(setWeather(cachedWeather));
          dispatch(setHour(new Date().getHours()));
          dispatch(setLoading(false));
          return cachedWeather;
        }

        //console.log("⏰ Cache expired, will fetch new data");
      } else {
        //console.log("❌ No cached weather found");
      }

      // 2. Fetch current location
      const { latitude, longitude } = await fetchLocation();
      //console.log("📍 Fetched location:", latitude, longitude);

      // 3. Fetch new weather from API
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}`
      );
      const json = await res.json();
      const currentWeather = json?.weather?.[0] || {};

      //console.log("🌤️ Fetched weather:", currentWeather);

      // 4. Update state
      dispatch(setWeather(currentWeather));
      dispatch(setHour(new Date().getHours()));

      // 5. Save to cache
      await SecureStore.setItemAsync(
        WEATHER_CACHE_KEY,
        JSON.stringify({
          timestamp: now,
          weather: currentWeather,
        })
      );
      return currentWeather;
      //console.log("💾 Weather cached successfully");
    } catch (err: any) {
      console.error("❌ Error fetching weather:", err);
      dispatch(setError(err?.message || "Failed to fetch weather"));
      return null
    } finally {
      dispatch(setLoading(false));
    }
  };

  return { weather, hour, loading, error, fetchWeather };
}
