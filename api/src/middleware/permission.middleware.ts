import type { RequestHandler } from "express";
import { AppError } from "../utils/app-error.js";

export const requirePermission =
  (...permissions: string[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.auth)
      return next(new AppError(401, "Tidak terautentikasi", "UNAUTHORIZED"));
    if (
      req.auth.role === "OWNER" ||
      permissions.some((permission) =>
        req.auth?.permissions.includes(permission),
      )
    )
      return next();
    return next(
      new AppError(
        403,
        "Anda tidak memiliki izin untuk tindakan ini",
        "FORBIDDEN",
      ),
    );
  };
