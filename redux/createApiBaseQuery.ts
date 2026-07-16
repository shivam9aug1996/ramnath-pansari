import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { baseUrl } from "./constants";
import { applyAppCheckHeader } from "@/utils/appCheck";

type RootLike = {
  auth?: {
    token?: string | null;
  };
};

/**
 * Shared RTK Query baseQuery: Bearer auth + X-Firebase-AppCheck when available.
 */
export function createApiBaseQuery(): BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> {
  return fetchBaseQuery({
    baseUrl: `${baseUrl}`,
    credentials: "include",
    prepareHeaders: async (headers, { getState }) => {
      const token = (getState() as RootLike)?.auth?.token;
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      await applyAppCheckHeader(headers);
      return headers;
    },
  });
}
