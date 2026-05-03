let bugScopeConfig = {
  projectId: null,
  environment: "development",
  backendUrl: "http://localhost:5000",
  enableAutoSeverity: true, // Auto-detect severity from error
};

window.initBugScope = function (config) {
  bugScopeConfig = { ...bugScopeConfig, ...config };

  if (!bugScopeConfig.projectId) {
    console.error("BugScope: projectId is required!");
    return;
  }

  console.log(" BugScope initialized for", bugScopeConfig.projectId);

  window.addEventListener("error", (event) => {
    handleError({
      message: event.message || "Unknown error",
      stack: event.error?.stack || "No stack trace available",
      type: "sync",
      autoSeverity: bugScopeConfig.enableAutoSeverity,
    });
  });
  window.addEventListener("unhandledrejection", (event) => {
    const message = event.reason?.message || String(event.reason);
    handleError({
      message,
      stack: event.reason?.stack || "No stack trace available",
      type: "async",
      severity: "high",
    });
  });
};

function getSeverityFromError(error) {
  if (!error) return "medium";

  const message = (error.message || "").toLowerCase();
  const stack = (error.stack || "").toLowerCase();

  const highKeywords = [
    "payment",
    "transaction",
    "security",
    "authentication",
    "authorization",
    "critical",
    "fatal",
    "cannot read properties of undefined", 
  ];

  for (let keyword of highKeywords) {
    if (message.includes(keyword) || stack.includes(keyword)) {
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
    if (message.includes(keyword) || stack.includes(keyword)) {
      return "low";
    }
  }

  return "medium";
}
function handleError(errorData) {
  // Determine severity
  let severity = errorData.severity || "medium";

  if (errorData.autoSeverity) {
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
  };

  // Send to backend
  fetch(`${bugScopeConfig.backendUrl}/api/errors/log`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }).catch((err) => {
    // Fail silently - don't break user's app if tracking fails
    console.error("🐛 BugScope: Failed to send error", err);
  });
}
window.reportBugScopeError = function (message, severity = "medium") {
  if (!bugScopeConfig.projectId) {
    console.error("BugScope: not initialized!");
    return;
  }

  handleError({
    message,
    stack: new Error().stack,
    severity,
  });
};

window.getBugScopeSeverityStats = async function () {
  const response = await fetch(
    `${bugScopeConfig.backendUrl}/api/errors/stats/${bugScopeConfig.projectId}`
  );
  return response.json();
};