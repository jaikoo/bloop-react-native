/**
 * Type-level tests for LLM tracing support in bloop-react-native.
 *
 * These imports and usages must compile cleanly (npx tsc --noEmit)
 * once tracing is properly wired through the RN SDK.
 *
 * TDD Phase 1: This file should FAIL before implementation.
 */

// 1. Tracing types must be re-exported from the package index
import {
  BloopRNClient,
  Trace,
  Span,
} from "./src/index";

import type {
  TraceOptions,
  TraceGenerationOptions,
  SpanOptions,
  SpanEndOptions,
  TraceEndOptions,
  SpanType,
  SpanStatus,
  TraceStatus,
} from "./src/index";

// 2. Type assignments to verify the re-exported types are correct
const spanType: SpanType = "generation";
const spanStatus: SpanStatus = "ok";
const traceStatus: TraceStatus = "completed";

const traceOpts: TraceOptions = {
  name: "test-trace",
  sessionId: "sess-1",
  userId: "user-1",
  input: "hello",
  metadata: { foo: "bar" },
};

const spanOpts: SpanOptions = {
  spanType: "generation",
  name: "llm-call",
  model: "gpt-4o",
  provider: "openai",
  input: "hello",
};

const spanEndOpts: SpanEndOptions = {
  inputTokens: 100,
  outputTokens: 50,
  cost: 0.002,
  status: "ok",
  output: "world",
  timeToFirstTokenMs: 120,
};

const traceEndOpts: TraceEndOptions = {
  status: "completed",
  output: "world",
};

// 3. BloopRNClient must have startTrace() method
declare const client: BloopRNClient;
const trace: Trace = client.startTrace(traceOpts);

// 4. Trace must support startSpan and end
const span: Span = trace.startSpan(spanOpts);
span.end(spanEndOpts);
trace.end(traceEndOpts);

// 5. BloopRNClient must have traceGeneration() convenience method
async function testTraceGeneration() {
  const result: string = await client.traceGeneration(
    {
      name: "gen-test",
      model: "gpt-4o",
      provider: "openai",
      input: "hi",
      sessionId: "sess-1",
      userId: "user-1",
    },
    async (span: Span) => {
      span.end({ status: "ok", inputTokens: 10, outputTokens: 5, output: "hey" });
      return "hey";
    }
  );
}

// 6. Existing error methods must still work (backward compat)
client.capture({
  errorType: "TypeError",
  message: "test",
});
client.captureError(new Error("test"));
client.flush();
client.shutdown();

// 7. Verify the client field accessibility (protected, not private)
// This is tested implicitly -- if BloopRNClient can call this.client.startTrace()
// in its implementation, the field must be accessible from within the class.

console.log("All type tests pass!");
