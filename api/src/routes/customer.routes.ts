import { Router } from "express";
import {
  createCustomer,
  listCustomers,
} from "../controller/customer.controller.js";
import { requirePermission } from "../middleware/permission.middleware.js";
export const customerRoutes = Router();
customerRoutes.get("/", listCustomers);
customerRoutes.post("/", requirePermission("customers.manage"), createCustomer);
