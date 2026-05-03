# BugScope SDK

**Lightweight Error Tracking for JavaScript Applications**

A simple, zero-overhead SDK for capturing and tracking JavaScript errors in your web and Node.js applications. BugScope is a lightweight alternative to Sentry, designed for simplicity and ease of use.

## Features

- ✅ **Automatic Error Capture** - Catches uncaught exceptions and promise rejections
- ✅ **Smart Severity Detection** - Automatically assigns severity levels to errors
- ✅ **Breadcrumb Tracking** - Track user actions leading up to errors
- ✅ **Custom Error Reporting** - Manually report errors with custom data
- ✅ **Sample Rate Control** - Reduce data volume by sampling errors
- ✅ **Before Send Hook** - Filter or modify errors before sending
- ✅ **Zero Overhead** - Minimal performance impact
- ✅ **Easy Integration** - Works with any JavaScript framework

## Installation

### NPM

```bash
npm install @bugscope/sdk
```

### Yarn

```bash
yarn add @bugscope/sdk
```

### CDN (Browser)

```html
<script src="https://cdn.jsdelivr.net/npm/@bugscope/sdk@1.0.0/dist/index.js"></script>
```

## Quick Start

### Basic Setup (Browser)

```javascript
// Initialize BugScope with your project ID
BugScope.init({
  projectId: "your-project-id",
  apiKey: "your-api-key",
  environment: "production",
});

// That's it! Errors are now automatically captured
```

### React Application

```jsx
import BugScope from "@bugscope/sdk";

// Initialize in your main App component
useEffect(() => {
  BugScope.init({
    projectId: "your-project-id",
    apiKey: "your-api-key",
    environment: process.env.NODE_ENV,
  });
}, []);
```

### Vue Application

```vue
<script>
import BugScope from "@bugscope/sdk";

export default {
  name: "App",
  mounted() {
    BugScope.init({
      projectId: "your-project-id",
      apiKey: "your-api-key",
      environment: process.env.NODE_ENV,
    });
  },
};
</script>
```

### Angular Application

```typescript
import { Component, OnInit } from "@angular/core";
import BugScope from "@bugscope/sdk";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
})
export class AppComponent implements OnInit {
  ngOnInit() {
    BugScope.init({
      projectId: "your-project-id",
      apiKey: "your-api-key",
      environment: "production",
    });
  }
}
```

## Configuration Options

```javascript
BugScope.init({
  // REQUIRED
  projectId: "your-project-id", // Your BugScope project ID

  // OPTIONAL
  apiKey: "your-api-key", // API key for authentication
  environment: "production", // Environment (dev/staging/prod)
  backendUrl: "https://...", // BugScope backend URL
  enableAutoCapture: true, // Auto-capture unhandled errors
  enableAutoSeverity: true, // Auto-detect severity levels
  sampleRate: 1.0, // 0.0-1.0: % of errors to capture
  maxBreadcrumbs: 50, // Max breadcrumbs to track
  beforeSend: (payload) => payload, // Hook to filter/modify errors
});
```

## API Reference

### `BugScope.init(config)`

Initialize the BugScope SDK with configuration options.

```javascript
BugScope.init({
  projectId: "my-project",
  environment: "production",
});
```

### `BugScope.report(message, severity, customData)`

Manually report an error.

```javascript
BugScope.report("Custom error message", "high", {
  userId: 123,
  action: "purchase",
});
```

### `BugScope.addBreadcrumb(message, data, level)`

Track user actions (breadcrumbs).

```javascript
BugScope.addBreadcrumb(
  "User clicked checkout button",
  {
    cartTotal: 99.99,
  },
  "info",
);
```

### `BugScope.setUserContext(userId, email, customData)`

Associate errors with a specific user.

```javascript
BugScope.setUserContext("user-123", "user@example.com", {
  plan: "premium",
  region: "US",
});
```

### `BugScope.getStats()`

Fetch error statistics for your project.

```javascript
const stats = await BugScope.getStats();
console.log(stats); // { total: 100, critical: 5, high: 15, ... }
```

## Error Severity Levels

BugScope automatically assigns severity levels based on error keywords:

- **critical** - Payment, transaction, security, authentication, fatal errors
- **high** - Connection errors, timeouts, network failures
- **medium** - General errors (default)
- **low** - Warnings, deprecation notices, analytics errors

## Advanced Usage

### Custom Error Filtering

```javascript
BugScope.init({
  projectId: "my-project",
  beforeSend: (payload) => {
    // Skip errors from known third-party libraries
    if (payload.message.includes("third-party-lib")) {
      return null;
    }

    // Modify error before sending
    payload.customField = "custom-value";
    return payload;
  },
});
```

### Sample Rate Control

```javascript
// Capture only 10% of errors to reduce volume
BugScope.init({
  projectId: "my-project",
  sampleRate: 0.1,
});
```

### Track User Interactions

```javascript
// In your click handler
document.getElementById("checkout-btn").addEventListener("click", () => {
  BugScope.addBreadcrumb("Checkout initiated", {
    cartItems: 5,
    total: 99.99,
  });

  // Your checkout logic...
});
```

### Integration with Error Boundaries (React)

```jsx
import BugScope from "@bugscope/sdk";

class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    BugScope.report(`React Error: ${error.message}`, "high", { errorInfo });
  }

  render() {
    return this.props.children;
  }
}
```

## Performance Considerations

- **Minimal Overhead** - SDK adds <10KB to your bundle
- **Async Sending** - Errors sent asynchronously, non-blocking
- **Smart Batching** - Errors combined and sent efficiently
- **Configurable Sampling** - Reduce data volume with sample rates
- **Automatic Cleanup** - Old breadcrumbs automatically removed

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- IE 11 (with polyfills)

## Examples

### Next.js Application

```javascript
// pages/_app.js
import BugScope from "@bugscope/sdk";

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    BugScope.init({
      projectId: process.env.NEXT_PUBLIC_BUGSCOPE_ID,
      environment: process.env.NODE_ENV,
    });
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
```

### Svelte Application

```svelte
<script>
  import BugScope from '@bugscope/sdk';
  import { onMount } from 'svelte';

  onMount(() => {
    BugScope.init({
      projectId: 'my-project',
      environment: 'production'
    });
  });
</script>
```

## Troubleshooting

### "projectId is required" Error

Make sure to provide your project ID during initialization:

```javascript
BugScope.init({
  projectId: "your-actual-project-id", // Add your real project ID
});
```

### Errors Not Appearing

1. Check that your projectId is correct
2. Verify the backend URL is reachable
3. Check browser console for CORS errors
4. Ensure API key is valid (if required)

### Performance Issues

- Increase `sampleRate` to capture fewer errors
- Reduce `maxBreadcrumbs` to track fewer user actions
- Use `beforeSend` to filter unnecessary errors

## License

MIT License - Copyright © 2026 BugScope Contributors

## Links

- 🌐 **Website** - https://bugscope.dev
- 📖 **Documentation** - https://docs.bugscope.dev
- 🐛 **Report Issues** - https://github.com/gkverse/Bugscope/issues
- 💬 **Discussions** - https://github.com/gkverse/Bugscope/discussions

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) first.

## Support

For questions or issues, please open an issue on [GitHub](https://github.com/gkverse/Bugscope/issues).
