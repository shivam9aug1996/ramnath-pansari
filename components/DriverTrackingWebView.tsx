import { Platform } from "react-native";

/**
 * Single entry so web always goes through this file (Metro `.web.tsx` siblings
 * can otherwise bypass the entry and make debugging confusing).
 */
const DriverTrackingWebView =
  Platform.OS === "web"
    ? require("./driverTrackingWebImpl").default
    : require("./driverTrackingNativeImpl").default;


export default DriverTrackingWebView;
export type { DriverTrackingWebViewProps } from "./DriverTrackingWebView.shared";
export { buildLiveMapUrl } from "./DriverTrackingWebView.shared";
