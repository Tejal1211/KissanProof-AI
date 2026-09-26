import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

export interface AuthedRequest extends Request {
  userId?: string;
  userRole?: "farmer" | "official";
}

/**
 * Simple JWT-based session auth for the demo build.
 *
 * Production note: swap this for Firebase Auth by verifying the
 * Firebase ID token instead (admin.auth().verifyIdToken(token)) and
 * setting req.userId from its `uid` claim. No other route code needs
 * to change since they only read req.userId / req.userRole.
 */
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: { code: "UNAUTHENTICATED", message: "Please sign in to continue." },
    });
  }
  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { sub: string; role: "farmer" | "official" };
    req.userId = payload.sub;
    req.userRole = payload.role;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      error: { code: "INVALID_SESSION", message: "Your session has expired. Please sign in again." },
    });
  }
}

export function requireOfficial(req: AuthedRequest, res: Response, next: NextFunction) {
  if (req.userRole !== "official") {
    return res.status(403).json({
      success: false,
      error: { code: "FORBIDDEN", message: "This area is only available to official reviewers." },
    });
  }
  next();
}

export function signSession(userId: string, role: "farmer" | "official") {
  return jwt.sign({ sub: userId, role }, config.jwtSecret, { expiresIn: "12h" });
}
