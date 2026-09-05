import { Prisma } from "../../prisma/generated/prisma/client.js";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";

const productInput = z.object({
  name: z.string().trim().min(2).max(150),
  sku: z.string().trim().min(2).max(50),
  barcode: z.string().trim().max(50).nullable().optional(),
  categoryId: z.string().nullable().optional(),
  brandId: z.string().nullable().optional(),
  unitId: z.string().nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  costPrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  wholesalePrice: z.coerce.number().min(0).nullable().optional(),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  discount: z.coerce.number().min(0).default(0),
  minimumStock: z.coerce.number().int().min(0).default(5),
  active: z.boolean().default(true),
});

const productImageKeywords: Record<string, string> = {
  "Kopi Susu Gula Aren": "iced-coffee,brown-sugar",
  Americano: "americano-coffee",
  "Matcha Latte": "matcha-latte",
  "Air Mineral 600ml": "mineral-water-bottle",
  "Croissant Butter": "butter-croissant",
  "Roti Cokelat": "chocolate-bread",
  "Nasi Goreng Spesial": "fried-rice",
  "Mie Goreng": "fried-noodles",
  "Keripik Kentang": "potato-chips",
  "Biskuit Cokelat": "chocolate-biscuits",
  "Kacang Panggang": "roasted-peanuts",
  "Cokelat Bar": "chocolate-bar",
  "Sabun Mandi": "bath-soap",
  "Sampo 170ml": "shampoo-bottle",
  "Tisu Wajah": "facial-tissue",
  "Deterjen 800g": "laundry-detergent",
  "Kemeja Oxford": "oxford-shirt",
  "Kaos Basic": "basic-t-shirt",
  "Kabel USB-C": "usb-c-cable",
  "Charger 20W": "phone-charger",
};

const productImageUrl = (name: string) => {
  const keywords =
    productImageKeywords[name] ||
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const lock = Array.from(name).reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0,
  );

  return `https://loremflickr.com/640/480/${encodeURIComponent(keywords)}?lock=${lock}`;
};

export const listProducts = asyncHandler(async (req, res) => {
  const query = z
    .object({
      search: z.string().max(100).optional(),
      categoryId: z.string().optional(),
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().min(1).max(100).default(24),
    })
    .parse(req.query);
  const where: Prisma.ProductWhereInput = {
    tenantId: req.auth!.tenantId,
    deletedAt: null,
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { sku: { contains: query.search, mode: "insensitive" } },
            { barcode: { contains: query.search } },
          ],
        }
      : {}),
  };
  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        images: { where: { isPrimary: true }, take: 1 },
        inventories: {
          where: req.auth!.branchId
            ? { branchId: req.auth!.branchId }
            : undefined,
        },
      },
      orderBy: { name: "asc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.product.count({ where }),
  ]);
  res.json({
    success: true,
    message: "Produk ditemukan",
    data: items.map((item) => ({
      ...item,
      images: item.images.length
        ? item.images
        : [
            {
              secureUrl: productImageUrl(item.name),
              altText: item.name,
              isPrimary: true,
            },
          ],
    })),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit),
    },
  });
});

export const createProduct = asyncHandler(async (req, res) => {
  const input = productInput.parse(req.body);
  const product = await prisma.product.create({
    data: {
      ...input,
      tenantId: req.auth!.tenantId,
      barcode: input.barcode || null,
    },
  });
  if (req.auth!.branchId)
    await prisma.inventory.create({
      data: {
        tenantId: req.auth!.tenantId,
        branchId: req.auth!.branchId,
        productId: product.id,
      },
    });
  res.status(201).json({
    success: true,
    message: "Produk berhasil dibuat",
    data: product,
    meta: {},
  });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const input = productInput.partial().parse(req.body);
  const current = await prisma.product.findFirst({
    where: {
      id: String(req.params.id),
      tenantId: req.auth!.tenantId,
      deletedAt: null,
    },
  });
  if (!current) throw new AppError(404, "Produk tidak ditemukan", "NOT_FOUND");
  const product = await prisma.product.update({
    where: { id: current.id },
    data: {
      ...input,
      ...(input.barcode !== undefined
        ? { barcode: input.barcode || null }
        : {}),
    },
  });
  res.json({
    success: true,
    message: "Produk berhasil diperbarui",
    data: product,
    meta: {},
  });
});

export const archiveProduct = asyncHandler(async (req, res) => {
  const result = await prisma.product.updateMany({
    where: {
      id: String(req.params.id),
      tenantId: req.auth!.tenantId,
      deletedAt: null,
    },
    data: { active: false, deletedAt: new Date() },
  });
  if (!result.count)
    throw new AppError(404, "Produk tidak ditemukan", "NOT_FOUND");
  res.json({
    success: true,
    message: "Produk berhasil diarsipkan",
    data: null,
    meta: {},
  });
});

export const categories = asyncHandler(async (req, res) => {
  const items = await prisma.category.findMany({
    where: { tenantId: req.auth!.tenantId, active: true, deletedAt: null },
    orderBy: { name: "asc" },
  });
  res.json({
    success: true,
    message: "Kategori ditemukan",
    data: items,
    meta: {},
  });
});
