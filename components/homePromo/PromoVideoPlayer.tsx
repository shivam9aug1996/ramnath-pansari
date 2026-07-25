import { Platform } from "react-native";
import type { PromoVideoPlayerProps } from "./promoVideoShared";

/**
 * Single entry so web always goes through this file (Metro `.web.tsx` siblings
 * can otherwise bypass the entry).
 */
const PromoVideoPlayer =
  Platform.OS === "web"
    ? require("./promoVideoWebImpl").default
    : require("./promoVideoNativeImpl").default;

export default PromoVideoPlayer;
export type { PromoVideoPlayerProps };
