import { Router } from "express";
import { csrf, login, logout, me } from "../controller/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { authLimiter } from "../middleware/rate-limit.middleware.js";

export const authRoutes = Router();
authRoutes.get("/csrf", csrf);
authRoutes.post("/login", authLimiter, login);
authRoutes.post("/logout", requireAuth, logout);
authRoutes.get("/me", requireAuth, me);
