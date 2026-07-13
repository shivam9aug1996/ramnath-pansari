import { Image } from "react-native";
import { devError, devLog, devWarn } from "@/utils/devLog";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import Toast, { ToastShowParams } from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

type Callback = (...args: any[]) => void;

export const debounce = (
  callback: Callback,
  delay: number,
  immediate: boolean = false
) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: any[]) => {
    const callNow = immediate && !timeoutId;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (!immediate) {
        callback(...args);
      }
    }, delay);

    if (callNow) {
      callback(...args);
    }
  };
};

export const truncateText = (text, maxLength = 18) => {
  if (text?.length <= maxLength) {
    return text;
  }
  return text?.substring(0, maxLength) + "...";
};

export const preloadRemoteImages = async (remoteImages = []) => {
  const remoteImagePromises = remoteImages.map((url) => Image.prefetch(url));
  await Promise.all(remoteImagePromises);
};

export const downloadAsset = async (url, fileName) => {
  const fileUri = `${FileSystem.documentDirectory}${fileName}`;
  const { exists } = await FileSystem.getInfoAsync(fileUri);

  if (!exists) {
    //devLog("Downloading asset...");
    await FileSystem.downloadAsync(url, fileUri);
    //devLog("Asset downloaded and stored at:", fileUri);
  } else {
    //devLog("Asset already exists locally:", fileUri);
  }

  return fileUri;
};

// Usage

export function formatNumber(input) {
  const num = parseFloat(input); // Convert input to a number

  if (isNaN(num)) {
    return input; // If it's not a valid number, return the input as is
  }

  return num % 1 === 0 ? num.toString() : num.toFixed(2); // Format based on whether it's an integer
}

export const hapticFeedback = (style = Haptics.ImpactFeedbackStyle.Soft) => {
  try {
    Haptics.impactAsync(style);
  } catch (error) {
    devError("Haptics error:", error);
  }
};

export const showToast = ({ type, text2,onPress,text2Style }: ToastShowParams) => {
  Toast?.hide();
  setTimeout(() => {
    Toast?.show({
      type: type,
      text2: text2,
      onPress:()=>{
        onPress?.();
      },
    });
  }, 100);
};

export const hideAllToast = () => {
  Toast?.hide();
};

export const CACHE_DURATION = 5 * 60 * 1000;


export async function cleanOldProductCache(CACHE_DURATION: number) {
  const now = Date.now();
  try {
    const keys = await AsyncStorage.getAllKeys();
    const productKeys = keys.filter((k) => k.startsWith("products-"));

    for (const key of productKeys) {
      try {
        const cached = await AsyncStorage.getItem(key);
        if (!cached) continue;

        const { timestamp } = JSON.parse(cached || "{}");
        if (!timestamp) continue;

        const age = now - timestamp;
        if (age >= CACHE_DURATION) {
          devLog("Removing expired cache:", key);
          await AsyncStorage.removeItem(key);
        }
      } catch (err) {
        devWarn(`Error processing cache key: ${key}`, err);
      }
    }
  } catch (err) {
    devError("Error cleaning product cache:", err);
  }
}


export async function cleanAllProductCache() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const productKeys = keys.filter((k) => k.startsWith("products-"));

    for (const key of productKeys) {
      try {
        const cached = await AsyncStorage.getItem(key);
        if (!cached) continue;

      

      
          devLog("Removing expired cache:", key);
          await AsyncStorage.removeItem(key);
        
      } catch (err) {
        devWarn(`Error processing cache key: ${key}`, err);
      }
    }
  } catch (err) {
    devError("Error cleaning product cache:", err);
  }
}
