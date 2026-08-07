import { resolveApiBaseUrl } from "@/config/apiBase";

export const baseUrl = resolveApiBaseUrl();
export const hostUrl = baseUrl.replace(/\/api$/, "");
