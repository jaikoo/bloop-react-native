export { BloopRNClient, BloopRNConfig } from "./BloopClient";
export { BloopErrorBoundary } from "./ErrorBoundary";
export { useBloop } from "./hooks";

// Re-export tracing types from base SDK
export { Trace, Span } from "bloop-sdk";
export type {
  TraceOptions,
  TraceGenerationOptions,
  SpanOptions,
  SpanEndOptions,
  TraceEndOptions,
  SpanType,
  SpanStatus,
  TraceStatus,
} from "bloop-sdk";
