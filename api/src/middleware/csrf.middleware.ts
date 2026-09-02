import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

const sign = (nonce: string) =>
  `${nonce}.${createHmac("sha256", env.CSRF_SECRET).update(nonce).digest("hex")}`;
export const createCsrfToken = () => sign(randomBytes(24).toString("hex"));

export const csrfProtection: RequestHandler = (req, _res, next) => {
  if (
    ["GET", "HEAD", "OPTIONS"].includes(req.method) ||
    req.path === "/api/v1/auth/login"
  )
    return next();
  const cookie = req.cookies?.nexxus_csrf as string | undefined;
  const header = req.header("x-csrf-token");
  if (
    !cookie ||
    !header ||
    cookie.length !== header.length ||
    !timingSafeEqual(Buffer.from(cookie), Buffer.from(header))
  ) {
    return next(new AppError(403, "Token CSRF tidak valid", "CSRF_INVALID"));
  }
  const [nonce, signature] = cookie.split(".");
  if (!nonce || !signature || sign(nonce) !== cookie)
    return next(new AppError(403, "Token CSRF tidak valid", "CSRF_INVALID"));
  next();
};
