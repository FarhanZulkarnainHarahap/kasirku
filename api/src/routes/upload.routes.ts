import { Router } from "express";
import { uploadProductImages } from "../controller/upload.controller.js";
import { upload } from "../middleware/upload.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
export const uploadRoutes = Router();
uploadRoutes.post(
  "/products/:productId/images",
  requirePermission("products.manage"),
  upload.array("images", 5),
  uploadProductImages,
);
