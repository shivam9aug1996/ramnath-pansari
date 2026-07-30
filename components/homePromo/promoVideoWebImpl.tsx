import React, { memo, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import type { PromoVideoPlayerProps } from "./promoVideoShared";

/**
 * Web: poster paints first (LCP-friendly), then muted video mounts and autoplays.
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
  const [allowVideo, setAllowVideo] = useState(false);
  const [posterVisible, setPosterVisible] = useState(Boolean(posterUrl?.trim()));

  // Reset when media URLs change.
  useEffect(() => {
    setAllowVideo(false);
    setPosterVisible(Boolean(posterUrl?.trim()));
  }, [videoUrl, posterUrl]);

  // Let the poster paint, then attach <video> so LCP prefers the image.
  useEffect(() => {
    let cancelled = false;
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let raf2 = 0;

    const startVideo = () => {
      if (!cancelled) setAllowVideo(true);
    };

    const scheduleStart = () => {
      if (typeof requestIdleCallback !== "undefined") {
        idleId = requestIdleCallback(startVideo, { timeout: 450 });
      } else {
        timeoutId = setTimeout(startVideo, 300);
      }
    };

    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(scheduleStart);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      if (idleId !== undefined && typeof cancelIdleCallback !== "undefined") {
        cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, [videoUrl]);

  useEffect(() => {
    if (!allowVideo) return;
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

    const onPlaying = () => {
      if (posterUrl?.trim()) setPosterVisible(false);
    };

    video.addEventListener("loadedmetadata", tryPlay);
    video.addEventListener("loadeddata", tryPlay);
    video.addEventListener("canplay", tryPlay);
    video.addEventListener("playing", onPlaying);
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
      video.removeEventListener("playing", onPlaying);
      if (lockMute) video.removeEventListener("volumechange", onVolume);
      video.pause();
    };
  }, [videoUrl, active, lockMute, allowVideo, posterUrl]);

  const mediaStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit,
    display: "block",
    backgroundColor: "#000",
    border: "none",
  };

  const posterStyle: React.CSSProperties = {
    ...mediaStyle,
    position: "absolute",
    inset: 0,
    zIndex: 1,
  };

  return (
    <View style={[styles.fill, style]}>
      {posterVisible &&
        !!posterUrl?.trim() &&
        React.createElement("img", {
          src: posterUrl,
          alt: "",
          decoding: "async",
          // Help LCP prefer this image over a late video frame.
          fetchPriority: "high",
          style: posterStyle,
        })}
      {allowVideo &&
        React.createElement("video", {
          ref: videoRef,
          src: videoUrl,
          // Keep poster attr as fallback before first frame; real LCP img is above.
          poster: posterUrl || undefined,
          autoPlay: true,
          muted: true,
          loop: true,
          playsInline: true,
          controls: controls && !lockMute,
          preload: "auto",
          style: mediaStyle,
        })}
    </View>
  );
}

export default memo(PromoVideoPlayerWeb);

const styles = StyleSheet.create({
  fill: {
    width: "100%",
    height: "100%",
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#000",
  },
});
