import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { baseUrl } from "./constants";
import { applyAppCheckHeader } from "@/utils/appCheck";
import { devLog } from "@/utils/devLog";

type RootLike = {
  auth?: {
    token?: string | null;
    userData?: {
      _id?: string;
      isGuestUser?: boolean;
    } | null;
  };
};

function summarizeAuthToken(token: string | null | undefined) {
  if (!token || token === "null") {
    return { hasToken: false, tokenKind: "none" as const, tokenPreview: null };
  }
  if (token === "guest_token") {
    return {
      hasToken: true,
      tokenKind: "guest" as const,
      tokenPreview: "guest_token",
    };
  }
  return {
    hasToken: true,
    tokenKind: "jwt" as const,
    tokenPreview: `${token.slice(0, 16)}…${token.slice(-8)}`,
  };
}

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
    prepareHeaders: async (headers, { getState, endpoint }) => {
      const auth = (getState() as RootLike)?.auth;
      const token = auth?.token;
      const tokenSummary = summarizeAuthToken(token);

      devLog("[api] prepareHeaders", {
        endpoint,
        ...tokenSummary,
        userId: auth?.userData?._id ?? null,
        isGuestUser: Boolean(auth?.userData?.isGuestUser),
      });

      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      await applyAppCheckHeader(headers);
      return headers;
    },
  });
}
