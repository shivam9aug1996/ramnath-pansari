import { Image } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import Toast, { ToastShowParams } from "react-native-toast-message";

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
    //console.log("Downloading asset...");
    await FileSystem.downloadAsync(url, fileUri);
    //console.log("Asset downloaded and stored at:", fileUri);
  } else {
    //console.log("Asset already exists locally:", fileUri);
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
    console.error("Haptics error:", error);
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
