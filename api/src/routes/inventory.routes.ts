import { Router } from "express";
import {
  adjustInventory,
  listInventory,
} from "../controller/inventory.controller.js";
import { requirePermission } from "../middleware/permission.middleware.js";
export const inventoryRoutes = Router();
inventoryRoutes.get("/", listInventory);
inventoryRoutes.post(
  "/adjustments",
  requirePermission("inventory.adjust"),
  adjustInventory,
);
