import { MovementType, Prisma } from "../../prisma/generated/prisma/client.js";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/app-error.js";
import { asyncHandler } from "../utils/async-handler.js";

export const listInventory = asyncHandler(async (req, res) => {
  const branchId =
    (req.query.branchId as string | undefined) || req.auth!.branchId;
  if (!branchId)
    throw new AppError(400, "Cabang harus dipilih", "BRANCH_REQUIRED");
  const items = await prisma.inventory.findMany({
    where: { tenantId: req.auth!.tenantId, branchId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          barcode: true,
          minimumStock: true,
          sellingPrice: true,
        },
      },
    },
    orderBy: { product: { name: "asc" } },
  });
  res.json({
    success: true,
    message: "Stok ditemukan",
    data: items,
    meta: { total: items.length },
  });
});

export const adjustInventory = asyncHandler(async (req, res) => {
  const input = z
    .object({
      productId: z.string(),
      branchId: z.string().optional(),
      quantity: z
        .number()
        .int()
        .refine((v) => v !== 0),
      reason: z.string().trim().min(3).max(300),
    })
    .parse(req.body);
  const branchId = input.branchId || req.auth!.branchId;
  if (!branchId)
    throw new AppError(400, "Cabang harus dipilih", "BRANCH_REQUIRED");
  const movement = await prisma.$transaction(
    async (tx) => {
      const branch = await tx.branch.findFirst({
        where: { id: branchId, tenantId: req.auth!.tenantId },
      });
      const product = await tx.product.findFirst({
        where: {
          id: input.productId,
          tenantId: req.auth!.tenantId,
          deletedAt: null,
        },
      });
      if (!branch || !product)
        throw new AppError(
          404,
          "Cabang atau produk tidak ditemukan",
          "NOT_FOUND",
        );
      const inventory = await tx.inventory.upsert({
        where: { branchId_productId: { branchId, productId: product.id } },
        create: {
          tenantId: req.auth!.tenantId,
          branchId,
          productId: product.id,
        },
        update: {},
      });
      const after = inventory.quantity + input.quantity;
      if (after < 0 && !branch.allowNegativeStock)
        throw new AppError(
          409,
          "Stok tidak boleh menjadi negatif",
          "NEGATIVE_STOCK",
        );
      await tx.inventory.update({
        where: { id: inventory.id },
        data: { quantity: after },
      });
      return tx.stockMovement.create({
        data: {
          tenantId: req.auth!.tenantId,
          branchId,
          productId: product.id,
          userId: req.auth!.userId,
          type:
            input.quantity > 0
              ? MovementType.ADJUSTMENT_IN
              : MovementType.ADJUSTMENT_OUT,
          quantity: input.quantity,
          beforeQuantity: inventory.quantity,
          afterQuantity: after,
          referenceType: "ADJUSTMENT",
          referenceId: crypto.randomUUID(),
          reason: input.reason,
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
  res.status(201).json({
    success: true,
    message: "Stok berhasil disesuaikan",
    data: movement,
    meta: {},
  });
});
