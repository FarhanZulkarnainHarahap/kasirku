export type User = {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "MANAGER" | "CASHIER";
  tenantId: string;
  branchId: string | null;
  permissions: string[];
};
export type Category = { id: string; name: string };
export type Product = {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  sellingPrice: string;
  costPrice: string;
  taxRate: string;
  discount: string;
  minimumStock: number;
  active: boolean;
  category: Category | null;
  images: { secureUrl: string; altText: string | null }[];
  inventories: { quantity: number }[];
};
export type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
};
export type Sale = {
  id: string;
  invoiceNumber: string;
  total: string;
  subtotal: string;
  changeAmount: string;
  paidAmount: string;
  createdAt: string;
  customer?: Customer | null;
  items?: {
    id: string;
    productName: string;
    quantity: number;
    sellingPrice: string;
    subtotal: string;
  }[];
  payments?: { method: string; amount: string }[];
};
