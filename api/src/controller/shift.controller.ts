import {
  PaymentMethod,
  ShiftStatus,
} from "../../prisma/generated/prisma/client.js";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/app-error.js";
import { asyncHandler } from "../utils/async-handler.js";

export const currentShift = asyncHandler(async (req, res) => {
  const data = await prisma.cashierShift.findFirst({
    where: {
      tenantId: req.auth!.tenantId,
      userId: req.auth!.userId,
      status: ShiftStatus.OPEN,
    },
    include: { branch: { select: { id: true, name: true, code: true } } },
  });
  res.json({
    success: true,
    message: data ? "Shift aktif ditemukan" : "Belum ada shift aktif",
    data,
    meta: {},
  });
});
export const openShift = asyncHandler(async (req, res) => {
  const input = z
    .object({
      openingCash: z.coerce.number().min(0),
      branchId: z.string().optional(),
      notes: z.string().max(500).optional(),
    })
    .parse(req.body);
  const branchId = input.branchId || req.auth!.branchId;
  if (!branchId)
    throw new AppError(400, "Cabang harus dipilih", "BRANCH_REQUIRED");
  const existing = await prisma.cashierShift.findFirst({
    where: {
      tenantId: req.auth!.tenantId,
      userId: req.auth!.userId,
      status: ShiftStatus.OPEN,
    },
  });
  if (existing)
    throw new AppError(409, "Masih ada shift yang aktif", "SHIFT_ALREADY_OPEN");
  const data = await prisma.cashierShift.create({
    data: {
      tenantId: req.auth!.tenantId,
      branchId,
      userId: req.auth!.userId,
      openingCash: input.openingCash,
      notes: input.notes,
    },
  });
  res
    .status(201)
    .json({ success: true, message: "Shift berhasil dibuka", data, meta: {} });
});
export const closeShift = asyncHandler(async (req, res) => {
  const input = z
    .object({
      actualCash: z.coerce.number().min(0),
      notes: z.string().max(500).optional(),
    })
    .parse(req.body);
  const shift = await prisma.cashierShift.findFirst({
    where: {
      id: String(req.params.id),
      tenantId: req.auth!.tenantId,
      userId: req.auth!.userId,
      status: ShiftStatus.OPEN,
    },
  });
  if (!shift)
    throw new AppError(404, "Shift aktif tidak ditemukan", "NOT_FOUND");
  const cash = await prisma.payment.aggregate({
    where: { sale: { shiftId: shift.id }, method: PaymentMethod.CASH },
    _sum: { amount: true },
  });
  const movements = await prisma.cashMovement.findMany({
    where: { shiftId: shift.id },
  });
  const movementTotal = movements.reduce(
    (sum, item) =>
      sum + (item.type === "IN" ? Number(item.amount) : -Number(item.amount)),
    0,
  );
  const expected =
    Number(shift.openingCash) + Number(cash._sum.amount || 0) + movementTotal;
  const data = await prisma.cashierShift.update({
    where: { id: shift.id },
    data: {
      status: ShiftStatus.CLOSED,
      actualCash: input.actualCash,
      expectedCash: expected,
      difference: input.actualCash - expected,
      notes: input.notes,
      closedAt: new Date(),
    },
  });
  res.json({
    success: true,
    message: "Shift berhasil ditutup",
    data,
    meta: {},
  });
});
