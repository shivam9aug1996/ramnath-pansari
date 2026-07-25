import type { StyleProp, ViewStyle } from "react-native";

export type PromoVideoPlayerProps = {
  videoUrl: string;
  posterUrl?: string;
  /** Start muted (required for autoplay). */
  muted?: boolean;
  /** Keep muted even if UI tries to unmute (compact bubble). */
  lockMute?: boolean;
  controls?: boolean;
  /** cover for compact card, contain for fullscreen. */
  objectFit?: "cover" | "contain";
  style?: StyleProp<ViewStyle>;
  /** When false, pause / stop retry loops. */
  active?: boolean;
};
