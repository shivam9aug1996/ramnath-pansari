import { showToast } from "@/utils/utils";
import { clearAuthData } from "./features/authSlice";

const handle401Middleware = (store: any) => (next: any) => (action: any) => {
  const status = action?.payload?.status;
  const responseData = action?.payload?.data;
  const errorMessage = responseData?.error || responseData?.message;
  const endpointName = action?.meta?.arg?.endpointName;
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
    console.log("[api-error] retrying", { endpointName, status });
  } else if (status >= 400 && (isRejectedQuery || isRejectedMutation)) {
    if (shouldSkipGlobalToast) {
      console.log("[api-error] toast skipped (handled by screen)", {
        endpointName,
        status,
        responseData,
      });
    } else {
      console.log("[api-error] global toast", {
        endpointName,
        status,
        errorMessage,
        responseData,
      });
      showToast({ type: "error", text2: errorMessage || "Something went wrong" });
    }
  } else if (typeof status === "string") {
    showToast({ type: "error", text2: status });
  }

  return next(action);
};

export default handle401Middleware;
