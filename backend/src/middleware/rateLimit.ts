import rateLimit from "express-rate-limit";

/** Tighter limiter for endpoints that call the GenAI model, applied per-route. */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: "RATE_LIMITED", message: "Too many AI requests. Please wait a moment and try again." },
  },
});
