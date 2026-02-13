import { useEffect, useRef } from "react";
import { BloopRNClient, BloopRNConfig } from "./BloopClient";

/**
 * React hook that creates and manages a BloopRNClient instance.
 * Installs the global error handler on mount and cleans up on unmount.
 *
 * @example
 * ```tsx
 * function App() {
 *   const bloop = useBloop({
 *     endpoint: "https://bloop.example.com",
 *     projectKey: "bloop_abc123...",
 *     environment: "production",
 *     release: "1.0.0",
 *   });
 *
 *   // Use bloop.captureError() for manual captures
 *   return <View>...</View>;
 * }
 * ```
 */
export function useBloop(config: BloopRNConfig): BloopRNClient {
  const clientRef = useRef<BloopRNClient | null>(null);

  if (!clientRef.current) {
    clientRef.current = new BloopRNClient(config);
  }

  useEffect(() => {
    const client = clientRef.current!;
    client.installGlobalHandler();

    return () => {
      client.shutdown();
    };
  }, []);

  return clientRef.current;
}
