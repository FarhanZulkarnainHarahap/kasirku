import { Router } from "express";
import { listBranches, updateBranch } from "../controller/branch.controller.js";
import { requirePermission } from "../middleware/permission.middleware.js";
export const branchRoutes = Router();
branchRoutes.get("/", listBranches);
branchRoutes.patch("/:id", requirePermission("settings.manage"), updateBranch);
