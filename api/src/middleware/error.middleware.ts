import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { logger } from "../config/logger.js";
import { AppError } from "../utils/app-error.js";

export const notFound: RequestHandler = (req, _res, next) =>
  next(
    new AppError(
      404,
      `Endpoint ${req.method} ${req.path} tidak ditemukan`,
      "NOT_FOUND",
    ),
  );

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  req,
  res,
  _next,
) => {
  void _next;
  const appError =
    error instanceof AppError
      ? error
      : error instanceof ZodError
        ? new AppError(422, "Validasi gagal", "VALIDATION_ERROR", error.issues)
        : new AppError(500, "Terjadi kesalahan pada server", "INTERNAL_ERROR");
  if (appError.status >= 500)
    logger.error({ err: error, requestId: req.requestId }, "request failed");
  res.status(appError.status).json({
    success: false,
    message: appError.message,
    code: appError.code,
    errors: appError.errors ?? [],
    requestId: req.requestId,
  });
};
