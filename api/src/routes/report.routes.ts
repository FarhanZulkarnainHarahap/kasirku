import { Router } from "express";
import { dashboard } from "../controller/dashboard.controller.js";
import { requirePermission } from "../middleware/permission.middleware.js";
export const reportRoutes = Router();
reportRoutes.get("/dashboard", requirePermission("reports.view"), dashboard);
