import React, { memo, useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import type { PromoVideoPlayerProps } from "./promoVideoShared";

/**
 * Web: real HTML5 video — muted autoplay works in browsers without WebView.
 */
function PromoVideoPlayerWeb({
  videoUrl,
  posterUrl,
  lockMute = false,
  controls = false,
  objectFit = "cover",
  style,
  active = true,
}: PromoVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const forceMute = () => {
      video.muted = true;
      video.defaultMuted = true;
      video.volume = 0;
      video.setAttribute("muted", "");
    };

    forceMute();

    const tryPlay = () => {
      if (!active) {
        video.pause();
        return;
      }
      if (lockMute || video.paused) forceMute();
      video.play().catch(() => {});
    };

    const onVolume = () => {
      if (lockMute && (!video.muted || video.volume > 0)) forceMute();
    };

    video.addEventListener("loadedmetadata", tryPlay);
    video.addEventListener("loadeddata", tryPlay);
    video.addEventListener("canplay", tryPlay);
    if (lockMute) video.addEventListener("volumechange", onVolume);

    tryPlay();
    const t1 = setTimeout(tryPlay, 200);
    const t2 = setTimeout(tryPlay, 800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      video.removeEventListener("loadedmetadata", tryPlay);
      video.removeEventListener("loadeddata", tryPlay);
      video.removeEventListener("canplay", tryPlay);
      if (lockMute) video.removeEventListener("volumechange", onVolume);
      video.pause();
    };
  }, [videoUrl, active, lockMute]);

  return (
    <View style={[styles.fill, style]}>
      {React.createElement("video", {
        ref: videoRef,
        src: videoUrl,
        poster: posterUrl || undefined,
        autoPlay: true,
        muted: true,
        loop: true,
        playsInline: true,
        controls: controls && !lockMute,
        preload: "auto",
        style: {
          width: "100%",
          height: "100%",
          objectFit,
          display: "block",
          backgroundColor: "#000",
          border: "none",
        },
      })}
    </View>
  );
}

export default memo(PromoVideoPlayerWeb);

const styles = StyleSheet.create({
  fill: {
    width: "100%",
    height: "100%",
  },
});
