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

function hasSendableAuthToken(token: string | null | undefined) {
  return Boolean(token && token !== "null");
}

/**
 * Shared RTK Query baseQuery: Bearer auth + X-Firebase-AppCheck when available.
 * `cache: "no-store"` avoids browser 304 empty bodies that make RTK see `{ data: undefined }`.
 *
 * 401s from requests that went out with no token are tagged `skipClearAuth` so
 * handle401Middleware does not wipe a session that hydrates mid-flight.
 */
export function createApiBaseQuery(): BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> {
  const rawBaseQuery = fetchBaseQuery({
    baseUrl: `${baseUrl}`,
    credentials: "include",
    fetchFn: (input, init) =>
      fetch(input, {
        ...init,
        cache: "no-store",
      }),
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
      headers.set("Cache-Control", "no-cache");
      headers.set("Pragma", "no-cache");
      await applyAppCheckHeader(headers);
      return headers;
    },
  });

  return async (args, api, extraOptions) => {
    const tokenAtStart = (api.getState() as RootLike)?.auth?.token;
    const sentAuth = hasSendableAuthToken(tokenAtStart);
    const result = await rawBaseQuery(args, api, extraOptions);

    if (result.error?.status === 401 && !sentAuth) {
      const prevData = result.error.data;
      const data =
        prevData && typeof prevData === "object" && !Array.isArray(prevData)
          ? { ...(prevData as Record<string, unknown>), skipClearAuth: true }
          : { skipClearAuth: true, raw: prevData };

      devLog("[api] 401 without token at send — skipClearAuth", {
        endpoint: api.endpoint,
      });

      return {
        ...result,
        error: {
          ...result.error,
          data,
        },
      };
    }

    return result;
  };
}
