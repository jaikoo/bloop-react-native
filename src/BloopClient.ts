import { BloopClient as BaseBloopClient, BloopConfig, ErrorEvent } from "bloop-sdk";
import { Platform } from "react-native";

export interface BloopRNConfig extends Omit<BloopConfig, "source"> {
  /** Override source detection. Defaults to platform-based detection. */
  source?: "ios" | "android" | "api";
  /** App version string (e.g. "1.2.3"). */
  appVersion?: string;
  /** Build number (e.g. "42"). */
  buildNumber?: string;
}

export class BloopRNClient {
  private client: BaseBloopClient;
  private appVersion?: string;
  private buildNumber?: string;
  private originalHandler: ((error: Error, isFatal?: boolean) => void) | null =
    null;

  constructor(config: BloopRNConfig) {
    const source =
      config.source || (Platform.OS === "ios" ? "ios" : "android");
    this.appVersion = config.appVersion;
    this.buildNumber = config.buildNumber;

    this.client = new BaseBloopClient({
      ...config,
      source,
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
      ...event,
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

  /** Flush buffered events immediately. */
  async flush(): Promise<void> {
    return this.client.flush();
  }

  /** Shutdown the client, flushing remaining events. */
  async shutdown(): Promise<void> {
    this.uninstallGlobalHandler();
    return this.client.close();
  }
}

// ErrorUtils type declaration for React Native
declare const ErrorUtils: {
  getGlobalHandler(): (error: Error, isFatal?: boolean) => void;
  setGlobalHandler(handler: (error: Error, isFatal?: boolean) => void): void;
};
