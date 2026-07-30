import type { ComponentType } from "react";

export const SENTRY_DSN =
  "https://8a0bdb898eda3ee8f4694903e1cf94f0@o4511749906300928.ingest.us.sentry.io/4511749911347200";

/** Options shared by native + web (no Sentry import — safe for both bundles). */
export const sentryBaseOptions = {
  dsn: SENTRY_DSN,
  sendDefaultPii: true,
  enableLogs: true,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
} as const;

export type CaptureContext = Record<string, unknown>;

export type SentryRoot = ComponentType<any>;
