import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

type TokenPayload = {
  sub: string;
  tenantId: string;
  branchId: string | null;
  role: "OWNER" | "ADMIN" | "MANAGER" | "CASHIER";
  permissions: string[];
};

export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = req.cookies?.my_cashier_session as string | undefined;
  if (!token)
    return next(
      new AppError(401, "Silakan masuk terlebih dahulu", "UNAUTHORIZED"),
    );
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    req.auth = {
      userId: payload.sub,
      tenantId: payload.tenantId,
      branchId: payload.branchId,
      role: payload.role,
      permissions: payload.permissions,
    };
    next();
  } catch {
    next(
      new AppError(401, "Sesi tidak valid atau telah berakhir", "UNAUTHORIZED"),
    );
  }
};
