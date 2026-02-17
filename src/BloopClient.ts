import {
  BloopClient,
  Trace,
  Span,
} from "@dthink/bloop-sdk";
import type { BloopClientOptions } from "@dthink/bloop-sdk";
import { AppState, AppStateStatus, Platform } from "react-native";

export interface BloopRNConfig extends Omit<BloopClientOptions, "flushInterval" | "maxBufferSize"> {
  /** Override source detection. Defaults to platform-based detection. */
  source?: "ios" | "android" | "api";
  /** App version string (e.g. "1.2.3"). */
  appVersion?: string;
  /** Build number (e.g. "42"). */
  buildNumber?: string;
  /** Flush interval in ms. Default 5000. */
  flushInterval?: number;
  /** Max buffer size before auto-flush. Default 100. */
  maxBufferSize?: number;
}

export interface ErrorEvent {
  errorType: string;
  message: string;
  stack?: string;
  routeOrProcedure?: string;
  screen?: string;
  metadata?: Record<string, unknown>;
}

export class BloopRNClient {
  protected client: BloopClient;
  private source: string;
  private appVersion?: string;
  private buildNumber?: string;
  private originalHandler: ((error: Error, isFatal?: boolean) => void) | null =
    null;
  private appStateSubscription: { remove(): void } | null = null;
  private originalPromiseRejectionHandler: ((id: string, error: Error) => void) | null = null;

  constructor(config: BloopRNConfig) {
    this.source =
      config.source || (Platform.OS === "ios" ? "ios" : "android");
    this.appVersion = config.appVersion;
    this.buildNumber = config.buildNumber;

    this.client = new BloopClient({
      endpoint: config.endpoint,
      projectKey: config.projectKey,
      environment: config.environment,
      release: config.release,
      flushInterval: config.flushInterval,
      maxBufferSize: config.maxBufferSize,
    });
  }

  /** Capture an error event with RN-specific metadata. */
  capture(event: ErrorEvent): void {
    const metadata: Record<string, unknown> = {
      ...(event.metadata || {}),
      platform: Platform.OS,
      platformVersion: Platform.Version,
    };
    if (this.appVersion) metadata.appVersion = this.appVersion;
    if (this.buildNumber) metadata.buildNumber = this.buildNumber;

    this.client.capture({
      errorType: event.errorType,
      message: event.message,
      source: this.source,
      stack: event.stack,
      routeOrProcedure: event.routeOrProcedure,
      screen: event.screen,
      metadata,
    });
  }

  /** Capture a JS Error object. */
  captureError(error: Error, extra?: Record<string, unknown>): void {
    this.capture({
      errorType: error.name || "Error",
      message: error.message,
      stack: error.stack,
      metadata: extra,
    });
  }

  /** Install global error handler for uncaught JS exceptions. */
  installGlobalHandler(): void {
    const defaultHandler = ErrorUtils.getGlobalHandler();
    this.originalHandler =
      defaultHandler as (error: Error, isFatal?: boolean) => void;

    ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      this.captureError(error, { fatal: isFatal });
      // Call original handler
      if (this.originalHandler) {
        this.originalHandler(error, isFatal);
      }
    });
  }

  /** Remove the global error handler. */
  uninstallGlobalHandler(): void {
    if (this.originalHandler) {
      ErrorUtils.setGlobalHandler(this.originalHandler);
      this.originalHandler = null;
    }
  }

  /**
   * Listen to AppState changes and flush when the app moves to background or inactive.
   * Critical on iOS where backgrounded apps are killed without notice.
   */
  installAppStateHandler(): void {
    this.appStateSubscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (nextState === "background" || nextState === "inactive") {
          this.flush();
        }
      }
    );
  }

  /**
   * Hook global.onunhandledrejection for unhandled promise rejections.
   * React Native does not have addEventListener for this — uses the global callback.
   */
  installPromiseRejectionHandler(): void {
    const g = globalThis as any;
    if (g.onunhandledrejection) {
      this.originalPromiseRejectionHandler = g.onunhandledrejection;
    }
    g.onunhandledrejection = (event: any) => {
      const reason = event?.reason;
      const error =
        reason instanceof Error ? reason : new Error(String(reason));
      this.captureError(error, {
        unhandled: true,
        mechanism: "unhandledrejection",
      });
      if (this.originalPromiseRejectionHandler) {
        this.originalPromiseRejectionHandler(event?.id, error);
      }
    };
  }

  /** Start a new LLM trace. */
  startTrace(opts: {
    name?: string;
    traceId?: string;
    sessionId?: string;
    userId?: string;
    promptName?: string;
    promptVersion?: string;
  } = {}): Trace {
    return this.client.trace(opts);
  }

  /** Flush buffered events immediately. */
  flush(): void {
    this.client.flush();
  }

  /** Shutdown the client, flushing remaining events. */
  shutdown(): void {
    this.uninstallGlobalHandler();
    this.appStateSubscription?.remove();
    this.appStateSubscription = null;
    const g = globalThis as any;
    if (this.originalPromiseRejectionHandler) {
      g.onunhandledrejection = this.originalPromiseRejectionHandler;
      this.originalPromiseRejectionHandler = null;
    } else {
      delete g.onunhandledrejection;
    }
    this.client.close();
  }
}

// ErrorUtils type declaration for React Native
declare const ErrorUtils: {
  getGlobalHandler(): (error: Error, isFatal?: boolean) => void;
  setGlobalHandler(handler: (error: Error, isFatal?: boolean) => void): void;
};
