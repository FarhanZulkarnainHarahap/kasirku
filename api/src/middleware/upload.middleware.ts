import multer from "multer";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) =>
    allowed.has(file.mimetype)
      ? cb(null, true)
      : cb(
          new AppError(
            415,
            "Format gambar harus JPG, PNG, atau WebP",
            "INVALID_FILE_TYPE",
          ),
        ),
});
export function hasValidImageSignature(buffer: Buffer) {
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer
    .subarray(0, 8)
    .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp =
    buffer.subarray(0, 4).toString() === "RIFF" &&
    buffer.subarray(8, 12).toString() === "WEBP";
  return isJpeg || isPng || isWebp;
}
