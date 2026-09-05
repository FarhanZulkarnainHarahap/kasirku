import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/async-handler.js";
import { z } from "zod";
import { AppError } from "../utils/app-error.js";

export const updateBranch = asyncHandler(async (req, res) => {
  const input = z
    .object({
      name: z.string().trim().min(2).max(150),
      address: z.string().trim().max(500).nullable(),
      phone: z.string().trim().max(30).nullable(),
      email: z.email().nullable(),
      invoicePrefix: z.string().regex(/^[A-Za-z0-9-]{1,15}$/),
      receiptSize: z.union([z.literal(58), z.literal(80)]),
      allowNegativeStock: z.boolean(),
      allowCashWithoutShift: z.boolean(),
    })
    .parse(req.body);
  const branch = await prisma.branch.findFirst({
    where: {
      id: String(req.params.id),
      tenantId: req.auth!.tenantId,
      active: true,
    },
  });
  if (!branch) throw new AppError(404, "Cabang tidak ditemukan", "NOT_FOUND");
  const data = await prisma.branch.update({
    where: { id: branch.id },
    data: input,
  });
  res.json({
    success: true,
    message: "Pengaturan cabang disimpan",
    data,
    meta: {},
  });
});
export const listBranches = asyncHandler(async (req, res) => {
  const data = await prisma.branch.findMany({
    where: { tenantId: req.auth!.tenantId, active: true },
    orderBy: { name: "asc" },
  });
  res.json({
    success: true,
    message: "Cabang ditemukan",
    data,
    meta: { total: data.length },
  });
});
