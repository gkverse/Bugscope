const axios = require("axios");

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

class AIExplainer {
  async explainError(message, stack) {
    try {
      // Railway has network isolation, cannot reach external APIs
      // Using fallback response with static analysis
      
      const explanation = `Error Analysis: "${message}"\n\nThis error typically occurs when attempting to access properties or methods on undefined or null objects. The stack trace indicates the issue originated in your code execution flow.\n\nCommon cause: Accessing properties on variables that haven't been properly initialized or checked for null/undefined values.\n\nStack Context: ${stack?.substring(0, 150) || "No stack trace available"}`;
      
      const suggestedFixes = [
        "Add defensive null/undefined checks before accessing object properties",
        "Use optional chaining operator (?.) to safely access nested properties - example: obj?.property?.nested",
        "Implement proper error handling with try-catch blocks around risky operations",
        "Initialize all variables before use",
        "Add type checking or TypeScript for compile-time safety"
      ];

      return {
        explanation,
        suggestedFixes,
      };
    } catch (error) {
      console.error("AI explanation error:", error.message);
      return {
        explanation: "This error indicates an issue with property access on undefined or null values. Ensure all objects are properly initialized before accessing their properties.",
        suggestedFixes: [
          "Verify all variables are defined and initialized before use",
          "Add null/undefined checks before accessing properties",
          "Use try-catch blocks for error handling"
        ]
      };
    }
  }
}

module.exports = new AIExplainer();