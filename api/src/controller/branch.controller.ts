import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/async-handler.js";
export const listBranches = asyncHandler(async (req, res) => {
  const data = await prisma.branch.findMany({
    where: { tenantId: req.auth!.tenantId, active: true },
    orderBy: { name: "asc" },
  });
  res.json({
    success: true,
    message: "Cabang ditemukan",
    data,
    meta: { total: data.length },
  });
});
