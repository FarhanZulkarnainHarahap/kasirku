import { Router } from "express";
import { listBranches } from "../controller/branch.controller.js";
export const branchRoutes = Router();
branchRoutes.get("/", listBranches);
