import type { CaptureContext, SentryRoot } from "./sentryOptions";
import { sentryBaseOptions } from "./sentryOptions";

type SentryModule = typeof import("@sentry/react-native");

let sentryModule: SentryModule | null = null;
let initPromise: Promise<SentryModule | null> | null = null;

async function loadAndInitSentry(): Promise<SentryModule | null> {
  if (sentryModule) return sentryModule;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const Sentry = await import("@sentry/react-native");
      Sentry.init({
        ...sentryBaseOptions,
        integrations: [
          Sentry.mobileReplayIntegration(),
          Sentry.feedbackIntegration(),
        ],
      });
      sentryModule = Sentry;
      return Sentry;
    } catch (error) {
      console.warn("[sentry] failed to load on web", error);
      return null;
    }
  })();

  return initPromise;
}

/** Web only: load & init Sentry after first paint / idle. */
export function initSentryAfterFirstPaint(): () => void {
  let cancelled = false;
  let idleId: number | undefined;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let rafId: number | undefined;

  const run = () => {
    if (cancelled) return;
    void loadAndInitSentry();
  };

  if (typeof globalThis.requestIdleCallback === "function") {
    idleId = globalThis.requestIdleCallback(run, { timeout: 2500 });
  } else {
    rafId = requestAnimationFrame(() => {
      timeoutId = setTimeout(run, 0);
    });
  }

  return () => {
    cancelled = true;
    if (idleId != null && typeof globalThis.cancelIdleCallback === "function") {
      globalThis.cancelIdleCallback(idleId);
    }
    if (rafId != null) cancelAnimationFrame(rafId);
    if (timeoutId != null) clearTimeout(timeoutId);
  };
}

export function captureException(
  error: unknown,
  captureContext?: CaptureContext,
): void {
  if (sentryModule) {
    sentryModule.captureException(error, captureContext);
    return;
  }
  void loadAndInitSentry().then((Sentry) => {
    Sentry?.captureException(error, captureContext);
  });
}

/** No-op on web — Sentry.wrap would force an eager SDK import. */
export function wrapRoot<T extends SentryRoot>(Root: T): T {
  return Root;
}
