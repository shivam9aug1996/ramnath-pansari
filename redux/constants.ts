import { Platform } from "react-native";
 //export const baseUrl = "https://ramnath-pansari-nextjs.vercel.app/api";

export const baseUrl =
  !process.env.NODE_ENV || process.env.NODE_ENV === "development"
    ? Platform.OS == "android"
      ? "http://10.150.236.132:3000/api"
      : "http://10.150.236.132:3000/api"
    : "https://ramnath-pansari-nextjs.vercel.app/api";

export const hostUrl = baseUrl.replace("/api","")
