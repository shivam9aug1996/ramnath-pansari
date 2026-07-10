import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

/** Native: Keychain/Keystore. Web: AsyncStorage (localStorage). */
async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return AsyncStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function removeItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

/** JSON helpers — covers greeting cache, weather, etc. */
async function getJson<T>(key: string): Promise<T | null> {
  const raw = await getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function setJson(key: string, value: unknown): Promise<void> {
  await setItem(key, JSON.stringify(value));
}

async function clearAll(): Promise<void> {
  await AsyncStorage.clear();
  if (Platform.OS === "web") {
    return; // on web, storage already uses AsyncStorage only
  }
  const knownKeys = Object.values(StorageKeys);
  await Promise.all(
    knownKeys.map((key) =>
      SecureStore.deleteItemAsync(key).catch(() => {
        // key may not exist — ignore
      }),
    ),
  );
}

export const storage = {
  getItem,
  setItem,
  removeItem,
  getJson,
  setJson,
  clearAll,
};