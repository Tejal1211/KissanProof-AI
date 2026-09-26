import "dotenv/config";

export type AiProvider = "anthropic" | "gemini";

export function validateJwtSecret(nodeEnv: string, jwtSecret: string) {
  if (nodeEnv === "production" && jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must be set to at least 32 characters in production.");
  }
}

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) {
    // Never crash at import time in demo mode — surface at request time instead.
    return "";
  }
  return v;
}

export function resolveAiConfig(env: NodeJS.ProcessEnv = process.env) {
  const requested = (env.AI_PROVIDER ?? "").toLowerCase();
  const anthropicConfigured = Boolean(env.ANTHROPIC_API_KEY);
  const geminiConfigured = Boolean(env.GEMINI_API_KEY);

  let provider: AiProvider = "anthropic";
  if (requested === "gemini") {
    provider = geminiConfigured ? "gemini" : anthropicConfigured ? "anthropic" : "gemini";
  } else if (requested === "anthropic") {
    provider = anthropicConfigured ? "anthropic" : geminiConfigured ? "gemini" : "anthropic";
  } else if (geminiConfigured) {
    provider = "gemini";
  }

  return {
    provider,
    anthropicApiKey: env.ANTHROPIC_API_KEY ?? "",
    anthropicModel: env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
    geminiApiKey: env.GEMINI_API_KEY ?? "",
    geminiModel: env.GEMINI_MODEL ?? "gemini-3.8-flash",
  };
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  jwtSecret: required("JWT_SECRET", process.env.NODE_ENV === "production" ? "" : "dev-only-insecure-secret-change-me"),
  ...resolveAiConfig(),
  dataDir: process.env.DATA_DIR ?? "./data",
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB ?? 10),
  maxFilesPerClaim: Number(process.env.MAX_FILES_PER_CLAIM ?? 8),
};

validateJwtSecret(config.nodeEnv, config.jwtSecret);

export const isAiConfigured = () => Boolean(config.anthropicApiKey || config.geminiApiKey);
