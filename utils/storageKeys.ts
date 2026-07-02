export const StorageKeys = {
    token: "token",
    userData: "userData", // keep on AsyncStorage directly if you prefer
    lastSavedPushToken: "lastSavedPushToken",
    greetingCache: "GREETING_CACHE_KEY",
    weatherCache: "WEATHER_CACHE",
    locationCache: "LOCATION_CACHE",
    greetingCacheV2: "GREETING_CACHE_KEY_V2",
  } as const;