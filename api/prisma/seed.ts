import "dotenv/config";
import argon2 from "argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "./generated/prisma/client.js";
import pkg from "pg";

if (process.env.NODE_ENV === "production")
  throw new Error("Seed demo tidak boleh dijalankan di production");
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DIRECT_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const products = [
  ["Kopi Susu Gula Aren", "MIN-001", "8991001000011", 8000, 18000, "Minuman"],
  ["Americano", "MIN-002", "8991001000028", 6000, 15000, "Minuman"],
  ["Matcha Latte", "MIN-003", "8991001000035", 9000, 22000, "Minuman"],
  ["Air Mineral 600ml", "MIN-004", "8991001000042", 2500, 5000, "Minuman"],
  ["Croissant Butter", "MKN-001", "8991002000010", 8500, 16000, "Makanan"],
  ["Roti Cokelat", "MKN-002", "8991002000027", 5000, 10000, "Makanan"],
  ["Nasi Goreng Spesial", "MKN-003", "8991002000034", 16000, 32000, "Makanan"],
  ["Mie Goreng", "MKN-004", "8991002000041", 12000, 25000, "Makanan"],
  ["Keripik Kentang", "SNK-001", "8991003000019", 7000, 12000, "Camilan"],
  ["Biskuit Cokelat", "SNK-002", "8991003000026", 6000, 11000, "Camilan"],
  ["Kacang Panggang", "SNK-003", "8991003000033", 6500, 12000, "Camilan"],
  ["Cokelat Bar", "SNK-004", "8991003000040", 7500, 14000, "Camilan"],
  ["Sabun Mandi", "RTG-001", "8991004000018", 3500, 6500, "Rumah Tangga"],
  ["Sampo 170ml", "RTG-002", "8991004000025", 12000, 19000, "Rumah Tangga"],
  ["Tisu Wajah", "RTG-003", "8991004000032", 7000, 12000, "Rumah Tangga"],
  ["Deterjen 800g", "RTG-004", "8991004000049", 13500, 22000, "Rumah Tangga"],
  ["Kemeja Oxford", "FSN-001", "8991005000017", 85000, 149000, "Fashion"],
  ["Kaos Basic", "FSN-002", "8991005000024", 45000, 89000, "Fashion"],
  ["Kabel USB-C", "ELK-001", "8991006000016", 18000, 35000, "Elektronik"],
  ["Charger 20W", "ELK-002", "8991006000023", 55000, 99000, "Elektronik"],
] as const;

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "nexxus-mart-demo" },
    update: {},
    create: { name: "Nexxus Mart Demo", slug: "nexxus-mart-demo" },
  });
  let store = await prisma.store.findFirst({
    where: { tenantId: tenant.id, name: "Nexxus Mart" },
  });
  store ??= await prisma.store.create({
    data: {
      tenantId: tenant.id,
      name: "Nexxus Mart",
      email: "halo@nexxuspos.test",
      phone: "061-555-0199",
    },
  });
  const branch = await prisma.branch.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "MDN" } },
    update: {},
    create: {
      tenantId: tenant.id,
      storeId: store.id,
      code: "MDN",
      name: "Medan Utama",
      address: "Jl. Gatot Subroto No. 88, Medan",
      phone: "061-555-0199",
    },
  });
  const roles: [Role, string, string, string][] = [
    ["OWNER", "Owner Nexxus", "owner@nexxuspos.test", "Owner123!"],
    ["ADMIN", "Admin Toko", "admin@nexxuspos.test", "Admin123!"],
    ["MANAGER", "Manager Toko", "manager@nexxuspos.test", "Manager123!"],
    ["CASHIER", "Sari Kasir", "cashier@nexxuspos.test", "Cashier123!"],
  ];
  for (const [role, name, email, password] of roles) {
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { name, email, passwordHash: await argon2.hash(password) },
    });
    await prisma.userMembership.upsert({
      where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
      update: { role, branchId: branch.id },
      create: {
        tenantId: tenant.id,
        userId: user.id,
        branchId: branch.id,
        role,
      },
    });
  }
  const categories = new Map<string, string>();
  for (const name of [...new Set(products.map((item) => item[5]))]) {
    const category = await prisma.category.upsert({
      where: {
        tenantId_slug: {
          tenantId: tenant.id,
          slug: name.toLowerCase().replaceAll(" ", "-"),
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        name,
        slug: name.toLowerCase().replaceAll(" ", "-"),
      },
    });
    categories.set(name, category.id);
  }
  const unit = await prisma.unit.upsert({
    where: { tenantId_symbol: { tenantId: tenant.id, symbol: "pcs" } },
    update: {},
    create: { tenantId: tenant.id, name: "Pcs", symbol: "pcs" },
  });
  for (const [
    name,
    sku,
    barcode,
    costPrice,
    sellingPrice,
    category,
  ] of products) {
    const product = await prisma.product.upsert({
      where: { tenantId_sku: { tenantId: tenant.id, sku } },
      update: {},
      create: {
        tenantId: tenant.id,
        name,
        sku,
        barcode,
        costPrice,
        sellingPrice,
        categoryId: categories.get(category),
        unitId: unit.id,
        minimumStock: 5,
      },
    });
    const quantity = sku.endsWith("004") ? 4 : 40;
    await prisma.inventory.upsert({
      where: {
        branchId_productId: { branchId: branch.id, productId: product.id },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        branchId: branch.id,
        productId: product.id,
        quantity,
      },
    });
  }
  await prisma.supplier.upsert({
    where: { id: "demo-supplier-nexxus" },
    update: {},
    create: {
      id: "demo-supplier-nexxus",
      tenantId: tenant.id,
      name: "PT Sumber Makmur",
      company: "PT Sumber Makmur",
      email: "order@sumbermakmur.test",
      phone: "061-555-0220",
    },
  });
  await prisma.customer.upsert({
    where: {
      tenantId_email: { tenantId: tenant.id, email: "budi@example.com" },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Budi Santoso",
      email: "budi@example.com",
      phone: "081234567890",
    },
  });
  console.log(
    "Seed NEXXUS POS selesai. Gunakan akun demo yang tercantum di README.",
  );
}
main().finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
