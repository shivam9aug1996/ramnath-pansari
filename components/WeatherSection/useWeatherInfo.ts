import { fetchLocation } from "./fetchLocation";
import { devError, devLog, devWarn } from "@/utils/devLog";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/types/global";
import { setError, setHour, setLoading, setWeather } from "@/redux/features/weatherSlice";
import { storage } from "@/utils/storage";
import { StorageKeys } from "@/utils/storageKeys";

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
      //devLog("🌦️ useWeatherInfo hook triggered");
      dispatch(setLoading(true));
      dispatch(setError(null));
      const now = Date.now();

      // 1. Check for cached weather
      //const cached = await SecureStore.getItemAsync(WEATHER_CACHE_KEY);
      const cached = await storage.getItem(WEATHER_CACHE_KEY);
      let staleWeather: Record<string, unknown> | null = null;
      if (cached) {
        const { timestamp, weather: cachedWeather } = JSON.parse(cached);
        const age = now - timestamp;
        staleWeather = cachedWeather ?? null;

        if (age < CACHE_DURATION) {
          dispatch(setWeather(cachedWeather));
          dispatch(setHour(new Date().getHours()));
          dispatch(setLoading(false));
          return cachedWeather;
        }
      }

      const location = await fetchLocation();
      if (!location) {
        if (staleWeather) {
          dispatch(setWeather(staleWeather));
          dispatch(setHour(new Date().getHours()));
          return staleWeather;
        }
        return null;
      }

      const { latitude, longitude } = location;

      // 3. Fetch new weather from API
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}`
      );
      const json = await res.json();
      const currentWeather = json?.weather?.[0] || {};

      //devLog("🌤️ Fetched weather:", currentWeather);

      // 4. Update state
      dispatch(setWeather(currentWeather));
      dispatch(setHour(new Date().getHours()));

      // 5. Save to cache
      // await SecureStore.setItemAsync(
      //   WEATHER_CACHE_KEY,
      //   JSON.stringify({
      //     timestamp: now,
      //     weather: currentWeather,
      //   })
      // );

      await storage.setItem(
        StorageKeys.weatherCache,
        JSON.stringify({
          timestamp: now,
          weather: currentWeather,
        }),
      );
      return currentWeather;
    } catch (err: any) {
      devWarn("[weather] fetch failed", err?.message ?? err);
      dispatch(setError(err?.message || "Failed to fetch weather"));
      return null
    } finally {
      dispatch(setLoading(false));
    }
  };

  return { weather, hour, loading, error, fetchWeather };
}
