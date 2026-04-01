class ErrorGrouper {
  constructor() {
    this.patterns = [
      { regex: /Cannot read propert(y|ies) ['"`]([^'"`]+)['"`]/gi, replacement: "Cannot read property [PROPERTY]" },
      { regex: /Cannot set propert(y|ies) ['"`]([^'"`]+)['"`]/gi, replacement: "Cannot set property [PROPERTY]" },
      { regex: /\(line \d+\)/gi, replacement: "" },
      { regex: /:\d+:\d+/g, replacement: ":[LOCATION]" },
      { regex: /\b\d+\b/g, replacement: "[NUM]" },
      { regex: /https?:\/\/[^\s)]+/gi, replacement: "[URL]" },
      { regex: /['"`]([^'"`]+)['"`]/g, replacement: "[STRING]" },
      { regex: /\s+/g, replacement: " " },
    ];
  }

  normalize(message) {
    if (!message) return "";
    let normalized = String(message).trim();
    this.patterns.forEach((pattern) => {
      normalized = normalized.replace(pattern.regex, pattern.replacement);
    });
    return normalized.trim();
  }

  generateGroupingKey(message, stack) {
    let key = this.normalize(message);
    if (stack) {
      const stackLine = stack.split("\n")[1];
      if (stackLine) {
        const normalizedStack = this.normalize(stackLine);
        key += " | " + normalizedStack;
      }
    }
    key = key.replace(/[^a-zA-Z0-9\s[\]|]/g, "");
    return key;
  }

  getErrorPattern(message) {
    return this.normalize(message);
  }
}

module.exports = new ErrorGrouper();