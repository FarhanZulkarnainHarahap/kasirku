import { Router } from "express";
import { dashboard } from "../controller/dashboard.controller.js";
import { salesReport } from "../controller/report.controller.js";
import { requirePermission } from "../middleware/permission.middleware.js";
export const reportRoutes = Router();
reportRoutes.get("/sales", requirePermission("reports.view"), salesReport);
reportRoutes.get("/dashboard", requirePermission("reports.view"), dashboard);
