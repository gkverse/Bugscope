// BugScope SDK v1.0.0
// Lightweight Error Tracking for JavaScript Applications

let bugScopeConfig = {
  projectId: null,
  apiKey: null,
  environment: "development",
  backendUrl: "https://bugscope-production.up.railway.app",
  enableAutoSeverity: true,
  enableAutoCapture: true,
  sampleRate: 1.0, // Capture 100% of errors
  maxBreadcrumbs: 50,
  beforeSend: null, // Custom function to filter errors before sending
};

let breadcrumbs = [];

// Initialize BugScope SDK
function initBugScope(config) {
  bugScopeConfig = { ...bugScopeConfig, ...config };

  if (!bugScopeConfig.projectId) {
    console.error("🐛 BugScope Error: projectId is required!");
    console.error("Usage: initBugScope({ projectId: 'your-project-id', apiKey: 'your-api-key' })");
    return false;
  }

  console.log("🐛 BugScope SDK initialized successfully!");
  console.log(`   Project: ${bugScopeConfig.projectId}`);
  console.log(`   Environment: ${bugScopeConfig.environment}`);
  console.log(`   Backend: ${bugScopeConfig.backendUrl}`);

  if (bugScopeConfig.enableAutoCapture) {
    setupAutoErrorCapture();
  }

  return true;
}

// Determine error severity based on keywords
function getSeverityFromError(error) {
  if (!error) return "medium";

  const message = (error.message || "").toLowerCase();
  const stack = (error.stack || "").toLowerCase();
  const fullText = message + " " + stack;

  const criticalKeywords = [
    "payment",
    "transaction",
    "security",
    "authentication",
    "authorization",
    "critical",
    "fatal",
    "database connection failed",
    "cannot read properties of undefined",
    "typeerror",
  ];

  for (let keyword of criticalKeywords) {
    if (fullText.includes(keyword)) {
      return "critical";
    }
  }

  const highKeywords = [
    "error",
    "failed",
    "timeout",
    "abort",
    "network error",
    "refused connection",
  ];

  for (let keyword of highKeywords) {
    if (fullText.includes(keyword)) {
      return "high";
    }
  }

  const lowKeywords = [
    "warning",
    "deprecated",
    "analytics",
    "tracking",
    "logging",
    "non-critical",
  ];

  for (let keyword of lowKeywords) {
    if (fullText.includes(keyword)) {
      return "low";
    }
  }

  return "medium";
}

// Add breadcrumb (user action tracking)
function addBreadcrumb(message, data = {}, level = "info") {
  const breadcrumb = {
    message,
    data,
    level,
    timestamp: new Date().toISOString(),
  };

  breadcrumbs.push(breadcrumb);

  // Keep only last N breadcrumbs
  if (breadcrumbs.length > bugScopeConfig.maxBreadcrumbs) {
    breadcrumbs.shift();
  }
}

// Handle and send error to backend
function handleError(errorData) {
  // Check sample rate
  if (Math.random() > bugScopeConfig.sampleRate) {
    return; // Skip this error based on sample rate
  }

  // Determine severity
  let severity = errorData.severity || "medium";

  if (errorData.autoSeverity && bugScopeConfig.enableAutoSeverity) {
    severity = getSeverityFromError(errorData);
  }

  const payload = {
    message: errorData.message,
    stack: errorData.stack,
    projectId: bugScopeConfig.projectId,
    environment: bugScopeConfig.environment,
    severity: severity,
    type: errorData.type || "unknown",
    timestamp: new Date().toISOString(),
    url: typeof window !== "undefined" ? window.location.href : null,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    breadcrumbs: breadcrumbs,
  };

  // Allow custom filtering via beforeSend callback
  if (bugScopeConfig.beforeSend && typeof bugScopeConfig.beforeSend === "function") {
    const filtered = bugScopeConfig.beforeSend(payload);
    if (filtered === null) {
      return; // beforeSend returned null, skip sending
    }
    Object.assign(payload, filtered);
  }

  // Send to backend
  sendErrorToBackend(payload);
}

// Send error to backend
function sendErrorToBackend(payload) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (bugScopeConfig.apiKey) {
    headers["Authorization"] = `Bearer ${bugScopeConfig.apiKey}`;
  }

  fetch(`${bugScopeConfig.backendUrl}/api/errors/log`, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(payload),
  }).catch((err) => {
    // Fail silently - don't break user's app if tracking fails
    console.error("🐛 BugScope: Failed to send error to backend", err);
  });
}

// Setup automatic error capture
function setupAutoErrorCapture() {
  // Capture synchronous errors
  window.addEventListener("error", (event) => {
    addBreadcrumb("Error captured", { message: event.message });
    handleError({
      message: event.message || "Unknown error",
      stack: event.error?.stack || "No stack trace available",
      type: "sync",
      autoSeverity: true,
    });
  });

  // Capture unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    const message = event.reason?.message || String(event.reason);
    addBreadcrumb("Unhandled rejection", { message });
    handleError({
      message: message,
      stack: event.reason?.stack || "No stack trace available",
      type: "async",
      severity: "high",
      autoSeverity: true,
    });
  });
}

// Manually report an error
function reportError(message, severity = "medium", customData = {}) {
  if (!bugScopeConfig.projectId) {
    console.error("🐛 BugScope Error: SDK not initialized! Call initBugScope() first.");
    return;
  }

  addBreadcrumb("Manual error report", { message, severity });
  handleError({
    message,
    stack: new Error().stack,
    severity,
    customData,
  });
}

// Get error statistics
async function getErrorStats() {
  if (!bugScopeConfig.projectId) {
    console.error("🐛 BugScope Error: SDK not initialized!");
    return null;
  }

  try {
    const response = await fetch(
      `${bugScopeConfig.backendUrl}/api/errors/stats/${bugScopeConfig.projectId}`
    );
    return response.json();
  } catch (err) {
    console.error("🐛 BugScope: Failed to fetch error stats", err);
    return null;
  }
}

// Set custom user context
function setUserContext(userId, email = null, customData = {}) {
  addBreadcrumb("User context set", { userId, email, ...customData });
  bugScopeConfig.userContext = { userId, email, ...customData };
}

// Export SDK functions
const BugScope = {
  init: initBugScope,
  report: reportError,
  addBreadcrumb,
  getStats: getErrorStats,
  setUserContext,
  config: bugScopeConfig,
};

// Make available globally
if (typeof window !== "undefined") {
  window.BugScope = BugScope;
  window.initBugScope = initBugScope;
  window.reportBugScopeError = reportError;
  window.getBugScopeSeverityStats = getErrorStats;
}

// Export for Node.js/CommonJS
if (typeof module !== "undefined" && module.exports) {
  module.exports = BugScope;
}

// Export for ES6 modules
export default BugScope;
export { initBugScope, reportError, addBreadcrumb, getErrorStats, setUserContext };