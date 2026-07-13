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
    store.dispatch(clearAuthData());
    showToast({ type: "error", text2: "Authentication failed" });
  } else if (status === 467) {
    devLog("[api-error] retrying", { endpointName, status });
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
      });
      showNetworkErrorToastOnce();
    } else {
      devLog("[api-error] network error skipped (query)", {
        endpointName,
        status,
      });
    }
  } else if (status >= 400 && (isRejectedQuery || isRejectedMutation)) {
    if (shouldSkipGlobalToast) {
      devLog("[api-error] toast skipped (handled by screen)", {
        endpointName,
        status,
        responseData,
      });
    } else {
      devLog("[api-error] global toast", {
        endpointName,
        status,
        errorMessage,
        responseData,
      });
      showToast({ type: "error", text2: errorMessage || "Something went wrong" });
    }
  } else if (typeof status === "string" && isRejected) {
    devLog("[api-error] unknown string status", { endpointName, status });
    if (isRejectedMutation && !shouldSkipGlobalToast) {
      showToast({ type: "error", text2: errorMessage || "Something went wrong" });
    }
  }

  return next(action);
};

export default handle401Middleware;
