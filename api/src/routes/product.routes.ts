import { Router } from "express";
import {
  archiveProduct,
  categories,
  createProduct,
  listProducts,
  updateProduct,
} from "../controller/product.controller.js";
import { requirePermission } from "../middleware/permission.middleware.js";

export const productRoutes = Router();
productRoutes.get("/categories", categories);
productRoutes.get("/", listProducts);
productRoutes.post("/", requirePermission("products.manage"), createProduct);
productRoutes.patch(
  "/:id",
  requirePermission("products.manage"),
  updateProduct,
);
productRoutes.delete(
  "/:id",
  requirePermission("products.manage"),
  archiveProduct,
);
