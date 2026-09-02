import { Router } from "express";
import { branchRoutes } from "./branch.routes.js";
import { customerRoutes } from "./customer.routes.js";
import { inventoryRoutes } from "./inventory.routes.js";
import { productRoutes } from "./product.routes.js";
import { reportRoutes } from "./report.routes.js";
import { saleRoutes } from "./sale.routes.js";
import { shiftRoutes } from "./shift.routes.js";
import { uploadRoutes } from "./upload.routes.js";

export const apiRoutes = Router();
apiRoutes.get("/health", (_req, res) =>
  res.json({
    success: true,
    message: "NEXXUS POS API sehat",
    data: { status: "ok", timestamp: new Date().toISOString() },
    meta: {},
  }),
);
apiRoutes.use("/branches", branchRoutes);
apiRoutes.use("/products", productRoutes);
apiRoutes.use("/inventory", inventoryRoutes);
apiRoutes.use("/customers", customerRoutes);
apiRoutes.use("/sales", saleRoutes);
apiRoutes.use("/shifts", shiftRoutes);
apiRoutes.use("/reports", reportRoutes);
apiRoutes.use("/uploads", uploadRoutes);
