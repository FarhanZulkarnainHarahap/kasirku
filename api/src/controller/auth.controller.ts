import type { RequestHandler } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { authenticate } from "../service/auth.service.js";
import { createCsrfToken } from "../middleware/csrf.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? ("none" as const) : ("lax" as const),
  maxAge: 8 * 60 * 60 * 1000,
  path: "/",
};

export const csrf: RequestHandler = (_req, res) => {
  const token = createCsrfToken();
  res.cookie("my_cashier_csrf", token, { ...cookieOptions, httpOnly: false });
  res.json({
    success: true,
    message: "Token CSRF dibuat",
    data: { csrfToken: token },
    meta: {},
  });
};

export const login = asyncHandler(async (req, res) => {
  const input = z
    .object({ email: z.email(), password: z.string().min(8) })
    .parse(req.body);
  const result = await authenticate(input.email, input.password);
  res.cookie("my_cashier_session", result.token, cookieOptions);
  res.json({
    success: true,
    message: "Berhasil masuk",
    data: result.user,
    meta: {},
  });
});

export const logout: RequestHandler = (_req, res) => {
  res.clearCookie("my_cashier_session", cookieOptions);
  res.json({ success: true, message: "Berhasil keluar", data: null, meta: {} });
};

export const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.auth!.userId },
    select: { id: true, name: true, email: true, phone: true, avatarUrl: true },
  });
  res.json({
    success: true,
    message: "Profil ditemukan",
    data: { ...user, ...req.auth },
    meta: {},
  });
});
