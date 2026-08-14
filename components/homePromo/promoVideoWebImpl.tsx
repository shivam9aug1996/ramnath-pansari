import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import type { PromoVideoPlayerProps } from "./promoVideoShared";

const MEDIA_BASE_STYLE: React.CSSProperties = {
  width: "100%",
  height: "100%",
  display: "block",
  backgroundColor: "#000000",
  border: "none",
};

const POSTER_STYLE: React.CSSProperties = {
  ...MEDIA_BASE_STYLE,
  position: "absolute",
  inset: 0,
  zIndex: 1,
};

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

  // Reset when media URLs change
  useEffect(() => {
    setAllowVideo(false);
    setPosterVisible(Boolean(posterUrl?.trim()));
  }, [videoUrl, posterUrl]);

  // Let the poster paint first, then mount <video> so LCP favors the poster image
  useEffect(() => {
    let cancelled = false;
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

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
      requestAnimationFrame(scheduleStart);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf1);
      if (idleId !== undefined && typeof cancelIdleCallback !== "undefined") {
        cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, [videoUrl]);

  // Force video element mute attributes for reliable browser autoplay policies
  const enforceMute = useCallback(
    (video: HTMLVideoElement) => {
      video.muted = true;
      video.defaultMuted = true;
      video.volume = 0;
      video.setAttribute("muted", "");
    },
    [],
  );

  // Play / Pause controls based on visibility active state
  useEffect(() => {
    if (!allowVideo) return;
    const video = videoRef.current;
    if (!video) return;

    enforceMute(video);

    if (active) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } else {
      video.pause();
    }
  }, [active, allowVideo, enforceMute, videoUrl]);

  const handlePlaying = useCallback(() => {
    if (posterUrl?.trim()) {
      setPosterVisible(false);
    }
  }, [posterUrl]);

  const handleVolumeChange = useCallback(() => {
    const video = videoRef.current;
    if (lockMute && video && (!video.muted || video.volume > 0)) {
      enforceMute(video);
    }
  }, [lockMute, enforceMute]);

  const mediaStyle: React.CSSProperties = {
    ...MEDIA_BASE_STYLE,
    objectFit,
  };

  const posterMediaStyle: React.CSSProperties = {
    ...POSTER_STYLE,
    objectFit,
  };

  return (
    <View style={[styles.fill, style]}>
      {posterVisible && !!posterUrl?.trim() && (
        <img
          src={posterUrl}
          alt=""
          decoding="async"
          fetchPriority="high"
          style={posterMediaStyle}
        />
      )}

      {allowVideo && (
        <video
          ref={videoRef}
          src={videoUrl}
          poster={posterUrl || undefined}
          autoPlay
          muted
          loop
          playsInline
          webkit-playsinline="true"
          controls={controls && !lockMute}
          preload="auto"
          onPlaying={handlePlaying}
          onVolumeChange={handleVolumeChange}
          style={mediaStyle}
        />
      )}
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
    backgroundColor: "#000000",
  },
});