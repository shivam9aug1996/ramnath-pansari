import { useState, useEffect } from "react";
import { Image } from "react-native";

export const usePreloadAssets = (remoteImages = []) => {
  const [status, setStatus] = useState("loading"); // 'loading', 'success', 'error'

  const preloadRemoteImages = async () => {
    const remoteImagePromises = remoteImages.map((url) => Image.prefetch(url));
    await Promise.all(remoteImagePromises);
  };

  useEffect(() => {
    const preload = async () => {
      try {
        await Promise.all([preloadRemoteImages()]);
        setStatus("success");
      } catch (error) {
        console.error("Error preloading assets:", error);
        setStatus("error");
      }
    };

    preload();
  }, []);

  return status; // Returns 'loading', 'success', or 'error'
};
