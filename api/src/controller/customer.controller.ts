import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/async-handler.js";

const inputSchema = z.object({
  name: z.string().trim().min(2),
  email: z.email().nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});
export const listCustomers = asyncHandler(async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search : "";
  const data = await prisma.customer.findMany({
    where: {
      tenantId: req.auth!.tenantId,
      active: true,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { phone: { contains: search } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { _count: { select: { sales: true } } },
    orderBy: { name: "asc" },
    take: 100,
  });
  res.json({
    success: true,
    message: "Pelanggan ditemukan",
    data,
    meta: { total: data.length },
  });
});
export const createCustomer = asyncHandler(async (req, res) => {
  const input = inputSchema.parse(req.body);
  const data = await prisma.customer.create({
    data: { ...input, tenantId: req.auth!.tenantId },
  });
  res.status(201).json({
    success: true,
    message: "Pelanggan berhasil dibuat",
    data,
    meta: {},
  });
});
