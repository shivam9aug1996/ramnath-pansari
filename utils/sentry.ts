import * as Sentry from "@sentry/react-native";
import {
  sentryBaseOptions,
  type CaptureContext,
  type SentryRoot,
} from "./sentryOptions";

Sentry.init({
  ...sentryBaseOptions,
  integrations: [
    Sentry.mobileReplayIntegration(),
    Sentry.feedbackIntegration(),
  ],
});

/** Native default: already initialized at module load. */
export function initSentryAfterFirstPaint(): () => void {
  return () => {};
}

export function captureException(
  error: unknown,
  captureContext?: CaptureContext,
): void {
  Sentry.captureException(error, captureContext);
}

export function wrapRoot<T extends SentryRoot>(Root: T): T {
  return Sentry.wrap(Root) as T;
}
