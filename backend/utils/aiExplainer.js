const axios = require("axios");

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const API_URL = "https://api-inference.huggingface.co/models/gpt2";

class AIExplainer {
  async explainError(message, stack) {
    try {
      if (!HUGGINGFACE_API_KEY) {
        console.warn("HUGGINGFACE_API_KEY not set");
        return null;
      }

      const prompt = `JavaScript Error: ${message}. Stack: ${stack}. Explanation:`;

      const response = await axios.post(
        API_URL,
        { inputs: prompt, parameters: { max_length: 100 } },
        {
          headers: {
            Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
          },
          timeout: 15000,
        }
      );

      const text = response.data[0]?.generated_text || "";
      
      const explanation = text.replace(prompt, "").trim() || "This error needs debugging.";
      const suggestedFixes = [
        "Check if variables exist before accessing properties",
        "Use try-catch blocks to handle errors gracefully"
      ];

      return {
        explanation,
        suggestedFixes,
      };
    } catch (error) {
      console.error("AI explanation error:", error.message);
      return {
        explanation: "This error indicates an issue with property access or undefined values.",
        suggestedFixes: [
          "Verify all variables are defined before use",
          "Add null/undefined checks before accessing properties"
        ]
      };
    }
  }
}

module.exports = new AIExplainer();