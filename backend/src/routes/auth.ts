import { Router } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { signupSchema, loginSchema } from "../validators/schemas.js";
import { createUser, findUserByEmail } from "../db.js";
import { signSession } from "../middleware/auth.js";
import { asyncHandler, AppError } from "../middleware/errorHandler.js";
import { config } from "../config.js";

export const authRouter = Router();

authRouter.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const body = signupSchema.parse(req.body);
    const existing = await findUserByEmail(body.email);
    if (existing) {
      throw new AppError("EMAIL_IN_USE", "An account with this email already exists.", 409);
    }
    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await createUser({
      id: uuid(),
      name: body.name,
      email: body.email,
      passwordHash,
      role: "farmer",
      createdAt: new Date().toISOString(),
    });
    const token = signSession(user.id, user.role);
    res.status(201).json({ success: true, data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } } });
  })
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const user = await findUserByEmail(body.email);
    // Same generic failure whether the email or password is wrong — no user enumeration.
    const invalid = () => new AppError("INVALID_CREDENTIALS", "Incorrect email or password.", 401);
    if (!user) throw invalid();
    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) throw invalid();
    const token = signSession(user.id, user.role);
    res.json({ success: true, data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } } });
  })
);

if (config.nodeEnv !== "production") {
  authRouter.post(
    "/demo-official-login",
    asyncHandler(async (_req, res) => {
      const token = signSession("demo-official", "official");
      res.json({ success: true, data: { token, user: { id: "demo-official", name: "Demo Reviewer", email: "", role: "official" } } });
    })
  );
}
