import { Router } from "express";
import {
  createSale,
  emailInvoice,
  emailStatus,
  getSale,
  invoicePdf,
  listSales,
} from "../controller/sale.controller.js";
import { requirePermission } from "../middleware/permission.middleware.js";
export const saleRoutes = Router();
saleRoutes.get("/", listSales);
saleRoutes.post("/", requirePermission("sales.create"), createSale);
saleRoutes.get("/:id", getSale);
saleRoutes.get("/:id/invoice.pdf", invoicePdf);
saleRoutes.post(
  "/:id/email-invoice",
  requirePermission("invoice.send"),
  emailInvoice,
);
saleRoutes.post(
  "/:id/resend-invoice",
  requirePermission("invoice.send"),
  emailInvoice,
);
saleRoutes.get("/:id/email-status", emailStatus);
