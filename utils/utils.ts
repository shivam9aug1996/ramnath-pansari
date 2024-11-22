import { Image } from "react-native";
import * as FileSystem from "expo-file-system";

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
  console.log("loadedassets65");
};

export const downloadAsset = async (url, fileName) => {
  const fileUri = `${FileSystem.documentDirectory}${fileName}`;
  const { exists } = await FileSystem.getInfoAsync(fileUri);

  if (!exists) {
    console.log("Downloading asset...");
    await FileSystem.downloadAsync(url, fileUri);
    console.log("Asset downloaded and stored at:", fileUri);
  } else {
    console.log("Asset already exists locally:", fileUri);
  }

  return fileUri;
};

// Usage
