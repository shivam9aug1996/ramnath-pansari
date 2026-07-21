import { devLog } from "@/utils/devLog";
import { showToast } from "@/utils/utils";
import { clearAuthData } from "./features/authSlice";

const NETWORK_ERROR_STATUSES = new Set([
  "FETCH_ERROR",
  "PARSING_ERROR",
  "TIMEOUT_ERROR",
  "CUSTOM_ERROR",
]);

const NETWORK_TOAST_COOLDOWN_MS = 10_000;
let lastNetworkToastAt = 0;

function showNetworkErrorToastOnce() {
  const now = Date.now();
  if (now - lastNetworkToastAt < NETWORK_TOAST_COOLDOWN_MS) return;
  lastNetworkToastAt = now;
  showToast({
    type: "error",
    text2: "Couldn't reach the server. Please check your connection and try again.",
  });
}

function authSnapshot(store: any) {
  const auth = store.getState()?.auth;
  const token = auth?.token as string | null | undefined;
  let tokenKind: "none" | "guest" | "jwt" = "none";
  let tokenPreview: string | null = null;
  if (token && token !== "null") {
    if (token === "guest_token") {
      tokenKind = "guest";
      tokenPreview = "guest_token";
    } else {
      tokenKind = "jwt";
      tokenPreview = `${token.slice(0, 16)}…${token.slice(-8)}`;
    }
  }
  return {
    tokenKind,
    tokenPreview,
    userId: auth?.userData?._id ?? null,
    isGuestUser: Boolean(auth?.userData?.isGuestUser),
    isClearingAuth: Boolean(auth?.clearAuthData?.isLoading),
  };
}

const handle401Middleware = (store: any) => (next: any) => (action: any) => {
  const status = action?.payload?.status;
  const responseData = action?.payload?.data;
  const errorMessage = responseData?.error || responseData?.message;
  const endpointName = action?.meta?.arg?.endpointName;
  const isRejected =
    action?.type?.endsWith("/rejected") &&
    (action?.meta?.arg?.type === "query" ||
      action?.meta?.arg?.type === "mutation");
  const isRejectedQuery =
    action?.type?.endsWith("/rejected") && action?.meta?.arg?.type === "query";
  const isRejectedMutation =
    action?.type?.endsWith("/rejected") && action?.meta?.arg?.type === "mutation";

  const shouldSkipGlobalToast =
    status === 409 ||
    Array.isArray(responseData?.heldProducts) ||
    endpointName === "updateProductsAsPerCart";

  if (status === 401) {
    const auth = authSnapshot(store);
    // In-flight requests (e.g. fetchGreetingMessage) often 401 during/after logout —
    // don't toast / clearAuth again.
    if (auth.tokenKind === "none" || auth.isClearingAuth) {
      devLog("[api-error] 401 ignored (logout in progress or already logged out)", {
        endpointName,
        status,
        errorMessage,
        actionType: action?.type,
        ...auth,
      });
    } else {
      devLog("[api-error] 401 clearing auth", {
        endpointName,
        status,
        errorMessage,
        responseData,
        actionType: action?.type,
        ...auth,
      });
      store.dispatch(clearAuthData());
      showToast({ type: "error", text2: "Authentication failed" });
    }
  } else if (status === 467) {
    devLog("[api-error] retrying", {
      endpointName,
      status,
      errorMessage,
      responseData,
      ...authSnapshot(store),
    });
  } else if (
    typeof status === "string" &&
    NETWORK_ERROR_STATUSES.has(status) &&
    isRejected
  ) {
    // Background GETs use screen-level TryAgain — no global toast spam.
    if (isRejectedMutation && !shouldSkipGlobalToast) {
      devLog("[api-error] network error toast (mutation)", {
        endpointName,
        status,
        errorMessage,
        responseData,
        ...authSnapshot(store),
      });
      showNetworkErrorToastOnce();
    } else {
      devLog("[api-error] network error skipped (query)", {
        endpointName,
        status,
        errorMessage,
        isRejectedQuery,
        shouldSkipGlobalToast,
        ...authSnapshot(store),
      });
    }
  } else if (status >= 400 && (isRejectedQuery || isRejectedMutation)) {
    if (shouldSkipGlobalToast) {
      devLog("[api-error] toast skipped (handled by screen)", {
        endpointName,
        status,
        errorMessage,
        responseData,
        ...authSnapshot(store),
      });
    } else {
      devLog("[api-error] global toast", {
        endpointName,
        status,
        errorMessage,
        responseData,
        isRejectedQuery,
        isRejectedMutation,
        ...authSnapshot(store),
      });
      showToast({ type: "error", text2: errorMessage || "Something went wrong" });
    }
  } else if (typeof status === "string" && isRejected) {
    devLog("[api-error] unknown string status", {
      endpointName,
      status,
      errorMessage,
      responseData,
      isRejectedMutation,
      shouldSkipGlobalToast,
      ...authSnapshot(store),
    });
    if (isRejectedMutation && !shouldSkipGlobalToast) {
      showToast({ type: "error", text2: errorMessage || "Something went wrong" });
    }
  }

  return next(action);
};

export default handle401Middleware;
