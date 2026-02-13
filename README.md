# @bloop/react-native

React Native error tracking SDK for [Bloop](https://github.com/jaikoo/eewwror) — self-hosted error tracking.

## Install

```bash
npm install @bloop/react-native
```

## Usage

```tsx
import { useBloop, BloopErrorBoundary } from "@bloop/react-native";

function App() {
  const bloop = useBloop({
    endpoint: "https://errors.myapp.com",
    projectKey: "bloop_abc123...",
    environment: "production",
    release: "1.0.0",
    appVersion: "1.0.0",
    buildNumber: "42",
  });

  return (
    <BloopErrorBoundary client={bloop} fallback={<ErrorScreen />}>
      <Navigation />
    </BloopErrorBoundary>
  );
}
```

## Features

- **useBloop hook** — Creates and manages the client lifecycle with global error handler
- **BloopErrorBoundary** — React error boundary that auto-captures render errors
- **Platform detection** — Automatically sets source to "ios" or "android"
- **Manual capture** — `bloop.captureError(error)` for caught exceptions

## License

MIT
