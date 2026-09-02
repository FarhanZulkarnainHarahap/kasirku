import { randomUUID } from "node:crypto";
import type { UploadApiResponse } from "cloudinary";
import { cloudinary, cloudinaryConfigured } from "../config/cloudinary.js";
import { prisma } from "../config/prisma.js";
import { hasValidImageSignature } from "../middleware/upload.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";

export const uploadProductImages = asyncHandler(async (req, res) => {
  if (!cloudinaryConfigured)
    throw new AppError(
      503,
      "Cloudinary belum dikonfigurasi",
      "CLOUDINARY_NOT_CONFIGURED",
    );
  const product = await prisma.product.findFirst({
    where: {
      id: String(req.params.productId),
      tenantId: req.auth!.tenantId,
      deletedAt: null,
    },
    include: { _count: { select: { images: true } } },
  });
  if (!product) throw new AppError(404, "Produk tidak ditemukan", "NOT_FOUND");
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files?.length)
    throw new AppError(422, "Pilih minimal satu gambar", "FILE_REQUIRED");
  if (product._count.images + files.length > 5)
    throw new AppError(422, "Maksimal lima gambar per produk", "IMAGE_LIMIT");
  if (files.some((file) => !hasValidImageSignature(file.buffer)))
    throw new AppError(
      415,
      "Signature file gambar tidak valid",
      "INVALID_FILE_SIGNATURE",
    );
  const uploaded: UploadApiResponse[] = [];
  try {
    for (const file of files) {
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `nexxus-pos/tenants/${req.auth!.tenantId}/products/${product.id}`,
            public_id: randomUUID(),
            resource_type: "image",
            allowed_formats: ["jpg", "jpeg", "png", "webp"],
          },
          (error, value) =>
            error || !value
              ? reject(error || new Error("Upload gagal"))
              : resolve(value),
        );
        stream.end(file.buffer);
      });
      uploaded.push(result);
    }
    const data = await prisma.$transaction(
      uploaded.map((image, index) =>
        prisma.productImage.create({
          data: {
            tenantId: req.auth!.tenantId,
            productId: product.id,
            publicId: image.public_id,
            secureUrl: image.secure_url,
            width: image.width,
            height: image.height,
            format: image.format,
            bytes: image.bytes,
            version: image.version,
            position: product._count.images + index,
            isPrimary: product._count.images === 0 && index === 0,
          },
        }),
      ),
    );
    res.status(201).json({
      success: true,
      message: "Gambar berhasil diunggah",
      data,
      meta: {},
    });
  } catch (error) {
    await Promise.allSettled(
      uploaded.map((image) => cloudinary.uploader.destroy(image.public_id)),
    );
    throw error;
  }
});
