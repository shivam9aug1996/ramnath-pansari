import type { Middleware } from "@reduxjs/toolkit";
import { logStartupFetch, isWithinStartupWindow } from "@/utils/startupDiagnostics";
import { isCategoryCacheHydrating } from "@/utils/categoryDebug";
import { isRecentSearchCacheHydrating } from "@/utils/recentSearchDebug";

const pendingStarts = new Map<string, number>();
const hydrateRequestIds = new Set<string>();

const startupFetchLoggerMiddleware: Middleware = () => (next) => (action) => {
  const typedAction = action as {
    meta?: {
      arg?: { endpointName?: string };
      requestId?: string;
      requestStatus?: "pending" | "fulfilled" | "rejected";
      baseQueryMeta?: { request?: { url?: string } };
    };
    error?: { message?: string };
    payload?: unknown;
  };

  const endpoint = typedAction.meta?.arg?.endpointName;
  const requestId = typedAction.meta?.requestId;
  const status = typedAction.meta?.requestStatus;

  const isHydrateUpsert =
    status === "pending" &&
    ((endpoint === "fetchRecentSearch" && isRecentSearchCacheHydrating()) ||
      (endpoint === "fetchCategories" && isCategoryCacheHydrating()));

  if (isHydrateUpsert && requestId) {
    hydrateRequestIds.add(requestId);
  }

  const skipHydrateLifecycle = Boolean(
    requestId && hydrateRequestIds.has(requestId),
  );

  if (
    isWithinStartupWindow() &&
    endpoint &&
    requestId &&
    status === "pending" &&
    !skipHydrateLifecycle
  ) {
    pendingStarts.set(requestId, Date.now());
    void logStartupFetch("start", {
      endpoint,
      url: typedAction.meta?.baseQueryMeta?.request?.url,
    });
  }

  const result = next(action);

  if (!isWithinStartupWindow() || !endpoint || !requestId) {
    return result;
  }

  if (status === "fulfilled") {
    if (skipHydrateLifecycle) {
      hydrateRequestIds.delete(requestId);
      return result;
    }
    const started = pendingStarts.get(requestId);
    pendingStarts.delete(requestId);
    void logStartupFetch("success", {
      endpoint,
      ms: started ? Date.now() - started : undefined,
    });
  }

  if (status === "rejected") {
    if (skipHydrateLifecycle) {
      hydrateRequestIds.delete(requestId);
      return result;
    }
    const started = pendingStarts.get(requestId);
    pendingStarts.delete(requestId);
    const errorMessage = String(
      typedAction.error?.message ?? typedAction.payload ?? "unknown",
    );
    const isSkipped =
      errorMessage.includes("Aborted due to condition callback") ||
      errorMessage.includes("condition callback returning false");
    void logStartupFetch(isSkipped ? "abort" : "error", {
      endpoint,
      ms: started ? Date.now() - started : undefined,
      error: isSkipped ? undefined : errorMessage,
    });
  }

  return result;
};

export default startupFetchLoggerMiddleware;
