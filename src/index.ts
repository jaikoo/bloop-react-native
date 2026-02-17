export { BloopRNClient } from "./BloopClient";
export type { BloopRNConfig, ErrorEvent } from "./BloopClient";
export { BloopErrorBoundary } from "./ErrorBoundary";
export { useBloop } from "./hooks";

// Re-export tracing types from base SDK
export { Trace, Span } from "@dthink/bloop-sdk";
export type { BloopClientOptions, TraceData, SpanData } from "@dthink/bloop-sdk";
