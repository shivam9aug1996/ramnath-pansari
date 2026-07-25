import { Platform } from "react-native";
//export const baseUrl = "https://ramnath-pansari-nextjs.vercel.app/api";

const LAN_API = "https://ramnath-pansari-nextjs.vercel.app/api";
const WEB_DEV_API = "https://ramnath-pansari-nextjs.vercel.app/api";
const PROD_API = "https://ramnath-pansari-nextjs.vercel.app/api";

export const baseUrl =
  !process.env.NODE_ENV || process.env.NODE_ENV === "development"
    ? Platform.OS === "web"
      ? WEB_DEV_API
      : LAN_API
    : PROD_API;

export const hostUrl = baseUrl.replace("/api", "");
