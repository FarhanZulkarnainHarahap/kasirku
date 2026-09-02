import { PaymentMethod, Prisma } from "../../prisma/generated/prisma/client.js";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/app-error.js";
import {
  calculateChange,
  calculateSubtotal,
  calculateTax,
  roundMoney,
} from "../utils/money.js";
import { invoiceNumber } from "../utils/invoice.js";

export const checkoutSchema = z.object({
  branchId: z.string().optional(),
  customerId: z.string().nullable().optional(),
  clientTransactionId: z.uuid(),
  notes: z.string().max(1000).optional(),
  discount: z.coerce.number().min(0).default(0),
  rounding: z.coerce.number().min(-1000).max(1000).default(0),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive().max(999),
        discount: z.coerce.number().min(0).default(0),
        notes: z.string().max(300).optional(),
      }),
    )
    .min(1)
    .max(100),
  payments: z
    .array(
      z.object({
        method: z.enum(PaymentMethod),
        amount: z.coerce.number().positive(),
        reference: z.string().max(100).optional(),
      }),
    )
    .min(1)
    .max(10),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export async function checkout(
  input: CheckoutInput,
  auth: NonNullable<Express.Request["auth"]>,
) {
  const branchId = input.branchId || auth.branchId;
  if (!branchId)
    throw new AppError(400, "Cabang harus dipilih", "BRANCH_REQUIRED");
  const existing = await prisma.sale.findFirst({
    where: {
      tenantId: auth.tenantId,
      clientTransactionId: input.clientTransactionId,
    },
    include: { items: true, payments: true },
  });
  if (existing) return { sale: existing, replayed: true };

  const sale = await prisma.$transaction(
    async (tx) => {
      const branch = await tx.branch.findFirst({
        where: { id: branchId, tenantId: auth.tenantId, active: true },
      });
      if (!branch)
        throw new AppError(404, "Cabang tidak ditemukan", "BRANCH_NOT_FOUND");
      const productIds = [
        ...new Set(input.items.map((item) => item.productId)),
      ];
      if (productIds.length !== input.items.length)
        throw new AppError(
          422,
          "Produk duplikat harus digabungkan",
          "DUPLICATE_PRODUCT",
        );
      const products = await tx.product.findMany({
        where: {
          id: { in: productIds },
          tenantId: auth.tenantId,
          active: true,
          deletedAt: null,
        },
        include: { inventories: { where: { branchId } } },
      });
      if (products.length !== productIds.length)
        throw new AppError(
          409,
          "Satu atau lebih produk tidak tersedia",
          "PRODUCT_UNAVAILABLE",
        );

      const lines = input.items.map((item) => {
        const product = products.find(
          (candidate) => candidate.id === item.productId,
        )!;
        const base = calculateSubtotal(
          Number(product.sellingPrice),
          item.quantity,
          item.discount,
        );
        const tax = calculateTax(base, Number(product.taxRate));
        return { item, product, tax, subtotal: roundMoney(base + tax) };
      });
      const itemsSubtotal = roundMoney(
        lines.reduce((sum, line) => sum + line.subtotal, 0),
      );
      const discount = Math.min(input.discount, itemsSubtotal);
      const total = roundMoney(itemsSubtotal - discount + input.rounding);
      const paidAmount = roundMoney(
        input.payments.reduce((sum, payment) => sum + payment.amount, 0),
      );
      if (paidAmount < total)
        throw new AppError(
          422,
          "Jumlah pembayaran kurang",
          "INSUFFICIENT_PAYMENT",
        );

      const containsCash = input.payments.some(
        (payment) => payment.method === PaymentMethod.CASH,
      );
      const shift = await tx.cashierShift.findFirst({
        where: {
          tenantId: auth.tenantId,
          branchId,
          userId: auth.userId,
          status: "OPEN",
        },
      });
      if (containsCash && !shift && !branch.allowCashWithoutShift)
        throw new AppError(
          409,
          "Buka shift sebelum menerima pembayaran tunai",
          "SHIFT_REQUIRED",
        );

      for (const line of lines) {
        const inventory = line.product.inventories[0];
        const before = inventory?.quantity ?? 0;
        if (before < line.item.quantity && !branch.allowNegativeStock)
          throw new AppError(
            409,
            `Stok ${line.product.name} tidak cukup`,
            "INSUFFICIENT_STOCK",
            [{ productId: line.product.id, available: before }],
          );
        if (inventory)
          await tx.inventory.update({
            where: { id: inventory.id },
            data: { quantity: { decrement: line.item.quantity } },
          });
        else
          await tx.inventory.create({
            data: {
              tenantId: auth.tenantId,
              branchId,
              productId: line.product.id,
              quantity: -line.item.quantity,
            },
          });
      }

      const startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);
      const sequence =
        (await tx.sale.count({
          where: {
            tenantId: auth.tenantId,
            branchId,
            createdAt: { gte: startOfDay },
          },
        })) + 1;
      const created = await tx.sale.create({
        data: {
          tenantId: auth.tenantId,
          branchId,
          cashierId: auth.userId,
          customerId: input.customerId,
          shiftId: shift?.id,
          invoiceNumber: invoiceNumber(branch.code, sequence),
          clientTransactionId: input.clientTransactionId,
          subtotal: itemsSubtotal,
          discount,
          tax: roundMoney(lines.reduce((sum, line) => sum + line.tax, 0)),
          rounding: input.rounding,
          total,
          paidAmount,
          changeAmount: calculateChange(paidAmount, total),
          notes: input.notes,
          items: {
            create: lines.map(({ item, product, tax, subtotal }) => ({
              productId: product.id,
              productName: product.name,
              sku: product.sku,
              barcode: product.barcode,
              costPrice: product.costPrice,
              sellingPrice: product.sellingPrice,
              quantity: item.quantity,
              discount: item.discount,
              tax,
              subtotal,
              notes: item.notes,
            })),
          },
          payments: { create: input.payments },
        },
        include: {
          items: true,
          payments: true,
          customer: true,
          branch: true,
          cashier: { select: { id: true, name: true } },
        },
      });

      await Promise.all(
        lines.map(({ item, product }) => {
          const before = product.inventories[0]?.quantity ?? 0;
          return tx.stockMovement.create({
            data: {
              tenantId: auth.tenantId,
              branchId,
              productId: product.id,
              userId: auth.userId,
              type: "SALE",
              quantity: -item.quantity,
              beforeQuantity: before,
              afterQuantity: before - item.quantity,
              referenceType: "SALE",
              referenceId: created.id,
            },
          });
        }),
      );
      await tx.auditLog.create({
        data: {
          tenantId: auth.tenantId,
          userId: auth.userId,
          action: "SALE_CREATED",
          entity: "Sale",
          entityId: created.id,
          metadata: { invoiceNumber: created.invoiceNumber, total },
        },
      });
      return created;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 15_000,
    },
  );
  return { sale, replayed: false };
}
