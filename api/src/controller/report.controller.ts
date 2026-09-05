import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/async-handler.js";

export const salesReport = asyncHandler(async (req, res) => {
  const input = z
    .object({
      from: z.iso.date(),
      to: z.iso.date(),
    })
    .refine((v) => v.from <= v.to, { message: "Rentang tanggal tidak valid" })
    .parse(req.query);
  const from = new Date(`${input.from}T00:00:00+07:00`);
  const until = new Date(
    new Date(`${input.to}T00:00:00+07:00`).getTime() + 86400000,
  );
  const where = {
    tenantId: req.auth!.tenantId,
    ...(req.auth!.branchId ? { branchId: req.auth!.branchId } : {}),
    status: "COMPLETED" as const,
    createdAt: { gte: from, lt: until },
  };
  const [summary, payments, products] = await prisma.$transaction([
    prisma.sale.aggregate({
      where,
      _sum: { total: true, discount: true, tax: true },
      _count: true,
      _avg: { total: true },
    }),
    prisma.payment.groupBy({
      by: ["method"],
      where: { sale: where },
      _sum: { amount: true },
      orderBy: { method: "asc" },
    }),
    prisma.saleItem.groupBy({
      by: ["productId", "productName"],
      where: { sale: where },
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { subtotal: "desc" } },
    }),
  ]);
  res.json({
    success: true,
    message: "Laporan penjualan ditemukan",
    data: { summary, payments, products },
    meta: { from: input.from, to: input.to, timezone: "Asia/Jakarta" },
  });
});
