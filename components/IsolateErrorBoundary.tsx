import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { captureException } from "@/utils/sentry";

type Props = {
  children: ReactNode;
  /** Optional fallback UI; defaults to rendering nothing. */
  fallback?: ReactNode;
  name?: string;
};

type State = {
  hasError: boolean;
};

/**
 * Catches render errors in non-critical UI so they don't bubble to the
 * root Expo Router ErrorBoundary and blank the whole app.
 */
export class IsolateErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    captureException(error, {
      tags: { isolateBoundary: this.props.name ?? "unknown" },
      extra: { componentStack: info.componentStack },
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
