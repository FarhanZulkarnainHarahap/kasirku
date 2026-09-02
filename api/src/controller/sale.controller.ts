import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/app-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { checkout, checkoutSchema } from "../service/sale.service.js";
import { createInvoicePdf } from "../service/pdf.service.js";
import { queueAndSendInvoice } from "../service/email.service.js";

const include = {
  items: true,
  payments: true,
  customer: true,
  branch: true,
  cashier: true,
} as const;
export const createSale = asyncHandler(async (req, res) => {
  const idempotencyKey = req.header("idempotency-key");
  const input = checkoutSchema.parse({
    ...req.body,
    clientTransactionId: idempotencyKey || req.body.clientTransactionId,
  });
  const result = await checkout(input, req.auth!);
  res.status(result.replayed ? 200 : 201).json({
    success: true,
    message: result.replayed
      ? "Transaksi yang sama ditemukan"
      : "Transaksi berhasil",
    data: result.sale,
    meta: { replayed: result.replayed },
  });
});
export const listSales = asyncHandler(async (req, res) => {
  const data = await prisma.sale.findMany({
    where: {
      tenantId: req.auth!.tenantId,
      ...(req.auth!.branchId ? { branchId: req.auth!.branchId } : {}),
    },
    include: {
      customer: { select: { name: true } },
      cashier: { select: { name: true } },
      payments: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  res.json({
    success: true,
    message: "Transaksi ditemukan",
    data,
    meta: { total: data.length },
  });
});
export const getSale = asyncHandler(async (req, res) => {
  const data = await prisma.sale.findFirst({
    where: { id: String(req.params.id), tenantId: req.auth!.tenantId },
    include,
  });
  if (!data) throw new AppError(404, "Transaksi tidak ditemukan", "NOT_FOUND");
  res.json({ success: true, message: "Transaksi ditemukan", data, meta: {} });
});
export const invoicePdf = asyncHandler(async (req, res) => {
  const sale = await prisma.sale.findFirst({
    where: { id: String(req.params.id), tenantId: req.auth!.tenantId },
    include,
  });
  if (!sale) throw new AppError(404, "Transaksi tidak ditemukan", "NOT_FOUND");
  const pdf = await createInvoicePdf(sale);
  res.setHeader("content-type", "application/pdf");
  res.setHeader(
    "content-disposition",
    `inline; filename="invoice-${sale.invoiceNumber}.pdf"`,
  );
  res.send(pdf);
});
export const emailInvoice = asyncHandler(async (req, res) => {
  const { email } = z.object({ email: z.email().optional() }).parse(req.body);
  const data = await queueAndSendInvoice(
    String(req.params.id),
    req.auth!.tenantId,
    email,
  );
  res.status(202).json({
    success: true,
    message:
      data.status === "FAILED" ? data.lastError : "Invoice sedang dikirim",
    data,
    meta: {},
  });
});
export const emailStatus = asyncHandler(async (req, res) => {
  const data = await prisma.emailJob.findFirst({
    where: { saleId: String(req.params.id), tenantId: req.auth!.tenantId },
    orderBy: { createdAt: "desc" },
  });
  res.json({
    success: true,
    message: "Status email ditemukan",
    data,
    meta: {},
  });
});
