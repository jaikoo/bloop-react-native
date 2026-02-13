import React, { Component, ErrorInfo, ReactNode } from "react";
import { BloopRNClient } from "./BloopClient";

interface Props {
  client: BloopRNClient;
  fallback?: ReactNode | ((error: Error) => ReactNode);
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * React error boundary that automatically captures errors to Bloop.
 *
 * @example
 * ```tsx
 * <BloopErrorBoundary client={bloopClient} fallback={<ErrorScreen />}>
 *   <App />
 * </BloopErrorBoundary>
 * ```
 */
export class BloopErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.props.client.captureError(error, {
      componentStack: errorInfo.componentStack ?? undefined,
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      const { fallback } = this.props;
      if (typeof fallback === "function") {
        return fallback(this.state.error);
      }
      if (fallback) {
        return fallback;
      }
      return null;
    }

    return this.props.children;
  }
}
