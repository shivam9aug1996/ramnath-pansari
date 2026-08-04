import { Platform } from "react-native";
import { DEFAULT_API_BASE, resolveApiBaseUrl } from "@/config/apiBase";

/** Override these when LAN / web-dev hosts diverge from production. */
const LAN_API = DEFAULT_API_BASE;
const WEB_DEV_API = DEFAULT_API_BASE;

export const baseUrl = process.env.EXPO_PUBLIC_API_BASE
  ? resolveApiBaseUrl()
  : !process.env.NODE_ENV || process.env.NODE_ENV === "development"
    ? Platform.OS === "web"
      ? WEB_DEV_API
      : LAN_API
    : DEFAULT_API_BASE;

export const hostUrl = baseUrl.replace(/\/api$/, "");
