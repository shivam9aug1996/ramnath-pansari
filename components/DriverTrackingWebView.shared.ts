import { hostUrl } from "@/redux/constants";

export type DriverTrackingWebViewProps = {
  orderId: string;
  height?: number;
  fullBleed?: boolean;
};

/** Public live map page — only needs orderId (not gated by middleware auth). */
export function buildLiveMapUrl(orderId: string) {
  return `${hostUrl?.replace("/api", "")}/liveMap?orderId=${encodeURIComponent(orderId)}`;
}
