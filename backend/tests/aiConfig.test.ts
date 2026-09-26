import { describe, expect, it } from "vitest";
import { resolveAiConfig, validateJwtSecret } from "../src/config.js";

describe("resolveAiConfig", () => {
  it("accepts a Gemini provider configuration", () => {
    const config = resolveAiConfig({
      AI_PROVIDER: "gemini",
      GEMINI_API_KEY: "gemini-test-key",
      ANTHROPIC_API_KEY: "",
      ANTHROPIC_MODEL: "claude-sonnet-4-6",
      GEMINI_MODEL: "gemini-3.8-flash",
    });

    expect(config.provider).toBe("gemini");
    expect(config.geminiApiKey).toBe("gemini-test-key");
    expect(config.geminiModel).toBe("gemini-3.8-flash");
    expect(config.anthropicApiKey).toBe("");
  });

  it("keeps Anthropic as the default provider when no explicit provider is set", () => {
    const config = resolveAiConfig({
      ANTHROPIC_API_KEY: "anthropic-test-key",
      GEMINI_API_KEY: "",
    });

    expect(config.provider).toBe("anthropic");
    expect(config.anthropicApiKey).toBe("anthropic-test-key");
  });
});

describe("validateJwtSecret", () => {
  it("rejects short production secrets", () => {
    expect(() => validateJwtSecret("production", "short-secret")).toThrow(/at least 32 characters/);
  });

  it("allows strong production secrets and local development defaults", () => {
    expect(() => validateJwtSecret("production", "a".repeat(32))).not.toThrow();
    expect(() => validateJwtSecret("development", "dev-only-insecure-secret-change-me")).not.toThrow();
  });
});
