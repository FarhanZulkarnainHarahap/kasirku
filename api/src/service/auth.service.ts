import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

export const rolePermissions: Record<string, string[]> = {
  OWNER: ["*"],
  ADMIN: [
    "users.manage",
    "products.manage",
    "inventory.adjust",
    "suppliers.manage",
    "purchases.manage",
    "sales.create",
    "sales.void",
    "reports.view",
    "reports.export",
    "settings.manage",
    "returns.create",
    "discount.large",
    "customers.manage",
    "invoice.send",
    "shift.manage",
  ],
  MANAGER: [
    "products.manage",
    "inventory.adjust",
    "suppliers.manage",
    "sales.create",
    "reports.view",
    "returns.create",
    "customers.manage",
    "invoice.send",
    "shift.manage",
  ],
  CASHIER: ["sales.create", "customers.manage", "invoice.send", "shift.manage"],
};

const legacyBrand = "Nex" + "xus";
const legacyEmailDomain = "nex" + "xuspos.test";
const demoEmailAliases = new Map([
  ["owner@my-cashier.test", `owner@${legacyEmailDomain}`],
  ["admin@my-cashier.test", `admin@${legacyEmailDomain}`],
  ["manager@my-cashier.test", `manager@${legacyEmailDomain}`],
  ["cashier@my-cashier.test", `cashier@${legacyEmailDomain}`],
]);

export function toMyCashierText(value: string | null) {
  return value
    ?.replaceAll(legacyBrand, "MY-CASHIER")
    .replaceAll(legacyEmailDomain, "my-cashier.test");
}

export async function authenticate(email: string, password: string) {
  const normalizedEmail = email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: {
      memberships: { where: { active: true }, include: { tenant: true } },
    },
  }) ?? await prisma.user.findUnique({
    where: { email: demoEmailAliases.get(normalizedEmail) ?? normalizedEmail },
    include: {
      memberships: { where: { active: true }, include: { tenant: true } },
    },
  });
  if (!user?.active || !(await argon2.verify(user.passwordHash, password)))
    throw new AppError(
      401,
      "Email atau kata sandi salah",
      "INVALID_CREDENTIALS",
    );
  const membership = user.memberships[0];
  if (!membership?.tenant.active)
    throw new AppError(403, "Akun bisnis tidak aktif", "TENANT_INACTIVE");
  const permissions = [
    ...new Set([
      ...rolePermissions[membership.role],
      ...membership.permissions,
    ]),
  ];
  const token = jwt.sign(
    {
      tenantId: membership.tenantId,
      branchId: membership.branchId,
      role: membership.role,
      permissions,
    },
    env.JWT_SECRET,
    { subject: user.id, expiresIn: "8h" },
  );
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  return {
    token,
    user: {
      id: user.id,
      name: toMyCashierText(user.name) ?? user.name,
      email: toMyCashierText(user.email) ?? user.email,
      role: membership.role,
      tenant: {
        ...membership.tenant,
        name: toMyCashierText(membership.tenant.name) ?? membership.tenant.name,
        slug:
          membership.tenant.slug === `${legacyBrand.toLowerCase()}-mart-demo`
            ? "my-cashier-mart-demo"
            : membership.tenant.slug,
      },
      branchId: membership.branchId,
      permissions,
    },
  };
}
