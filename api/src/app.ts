import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { pinoHttp } from "pino-http";
import { allowedOrigins, env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { csrfProtection } from "./middleware/csrf.middleware.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";
import { apiLimiter } from "./middleware/rate-limit.middleware.js";
import { requestContext } from "./middleware/request.middleware.js";
import { requireAuth } from "./middleware/auth.middleware.js";
import { apiRoutes } from "./routes/index.js";
import { authRoutes } from "./routes/auth.routes.js";

export const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(requestContext);
app.use(pinoHttp({ logger }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error("Origin tidak diizinkan"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "content-type",
      "x-csrf-token",
      "idempotency-key",
      "x-request-id",
    ],
    exposedHeaders: ["x-request-id"],
  }),
);
app.use(cookieParser(env.COOKIE_SECRET));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(apiLimiter);
app.use(csrfProtection);
app.get("/", (_req, res) =>
  res.json({
    success: true,
    message: "MY-CASHIER API berjalan",
    data: {
      name: "MY-CASHIER API",
      version: "v1",
      health: "/api/v1/health",
    },
    meta: {},
  }),
);
app.get("/api/v1/health", (_req, res) =>
  res.json({
    success: true,
    message: "MY-CASHIER API sehat",
    data: { status: "ok" },
    meta: {},
  }),
);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1", requireAuth, apiRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
