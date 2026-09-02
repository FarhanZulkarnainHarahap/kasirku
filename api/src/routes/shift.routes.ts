import { Router } from "express";
import {
  closeShift,
  currentShift,
  openShift,
} from "../controller/shift.controller.js";
import { requirePermission } from "../middleware/permission.middleware.js";
export const shiftRoutes = Router();
shiftRoutes.get("/current", currentShift);
shiftRoutes.post("/open", requirePermission("shift.manage"), openShift);
shiftRoutes.post("/:id/close", requirePermission("shift.manage"), closeShift);
