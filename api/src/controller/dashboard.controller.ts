import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/async-handler.js";

export const dashboard = asyncHandler(async (req, res) => {
  const branchId =
    (req.query.branchId as string | undefined) || req.auth!.branchId;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const previous = new Date(start);
  previous.setDate(previous.getDate() - 1);
  const saleWhere = {
    tenantId: req.auth!.tenantId,
    ...(branchId ? { branchId } : {}),
    status: "COMPLETED" as const,
  };
  const [
    today,
    yesterday,
    totalProducts,
    stock,
    recent,
    paymentGroups,
    topItems,
    daily,
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: { ...saleWhere, createdAt: { gte: start } },
      _sum: { total: true },
      _count: true,
      _avg: { total: true },
    }),
    prisma.sale.aggregate({
      where: { ...saleWhere, createdAt: { gte: previous, lt: start } },
      _sum: { total: true },
    }),
    prisma.product.count({
      where: { tenantId: req.auth!.tenantId, active: true, deletedAt: null },
    }),
    prisma.inventory.findMany({
      where: {
        tenantId: req.auth!.tenantId,
        ...(branchId ? { branchId } : {}),
      },
      select: { quantity: true, product: { select: { minimumStock: true } } },
    }),
    prisma.sale.findMany({
      where: saleWhere,
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
        createdAt: true,
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.payment.groupBy({
      by: ["method"],
      where: { sale: { ...saleWhere, createdAt: { gte: start } } },
      _sum: { amount: true },
    }),
    prisma.saleItem.groupBy({
      by: ["productName"],
      where: {
        sale: {
          ...saleWhere,
          createdAt: { gte: new Date(Date.now() - 30 * 86400000) },
        },
      },
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.$queryRaw<Array<{ date: Date; total: number }>>`
      SELECT
        DATE("createdAt") AS date,
        SUM(total)::float AS total
      FROM "Sale"
      WHERE "tenantId" = ${req.auth!.tenantId}
        AND "createdAt" >= ${new Date(Date.now() - 6 * 86400000)}
      GROUP BY DATE("createdAt")
      ORDER BY date
    `,
  ]);
  const todayTotal = Number(today._sum.total || 0);
  const previousTotal = Number(yesterday._sum.total || 0);
  res.json({
    success: true,
    message: "Dashboard diperbarui",
    data: {
      metrics: {
        salesToday: todayTotal,
        transactionsToday: today._count,
        averageTransaction: Number(today._avg.total || 0),
        totalProducts,
        lowStock: stock.filter(
          (item) =>
            item.quantity > 0 && item.quantity <= item.product.minimumStock,
        ).length,
        outOfStock: stock.filter((item) => item.quantity <= 0).length,
        comparison: previousTotal
          ? ((todayTotal - previousTotal) / previousTotal) * 100
          : 0,
      },
      salesChart: daily.map((row) => ({
        date: row.date,
        total: Number(row.total),
      })),
      paymentMethods: paymentGroups.map((group) => ({
        method: group.method,
        total: Number(group._sum.amount || 0),
      })),
      topProducts: topItems.map((item) => ({
        name: item.productName,
        quantity: item._sum.quantity || 0,
        total: Number(item._sum.subtotal || 0),
      })),
      recent,
    },
    meta: { branchId },
  });
});
