import { z } from "zod";

const defaultAllowedOrigins = [
  "http://localhost:3000",
  "https://my-kasirku.vercel.app",
];

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  WEB_APP_URL: z.string().url().default("https://my-kasirku.vercel.app"),
  CORS_ALLOWED_ORIGINS: z.string().default(defaultAllowedOrigins.join(",")),
  DATABASE_URL: z
    .string()
    .min(1)
    .default("postgresql://postgres:postgres@localhost:5432/my_cashier"),
  DIRECT_URL: z
    .string()
    .min(1)
    .default("postgresql://postgres:postgres@localhost:5432/my_cashier"),
  JWT_SECRET: z
    .string()
    .min(32)
    .default("development-only-jwt-secret-change-me-now"),
  COOKIE_SECRET: z
    .string()
    .min(32)
    .default("development-cookie-secret-change-me-now"),
  CSRF_SECRET: z
    .string()
    .min(32)
    .default("development-csrf-secret-change-me-now"),
  CLOUDINARY_CLOUD_NAME: z.string().default(""),
  CLOUDINARY_API_KEY: z.string().default(""),
  CLOUDINARY_API_SECRET: z.string().default(""),
  CLOUDINARY_PRODUCT_FOLDER: z.string().default("kasirku/products"),
  CLOUDINARY_LOGO_FOLDER: z.string().default("kasirku/logos"),
  CLOUDINARY_PLACEHOLDER_URL: z.string().default(""),
  RESEND_API_KEY: z.string().default(""),
  RESEND_FROM_EMAIL: z.string().default("MY-CASHIER <invoice@example.com>"),
  RESEND_REPLY_TO_EMAIL: z.string().default(""),
  APP_NAME: z.string().default("MY-CASHIER"),
  LOG_LEVEL: z.string().default("info"),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().positive().max(10).default(5),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    "Konfigurasi environment tidak valid",
    parsed.error.flatten().fieldErrors,
  );
  throw new Error("Environment tidak valid");
}

export const env = parsed.data;
export const allowedOrigins = [
  ...new Set(
    [
      env.WEB_APP_URL,
      ...defaultAllowedOrigins,
      ...env.CORS_ALLOWED_ORIGINS.split(","),
    ]
      .map((value) => value.trim())
      .filter(Boolean),
  ),
];
