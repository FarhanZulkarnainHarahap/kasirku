import type { Role } from "../../prisma/generated/prisma/client.js";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        tenantId: string;
        branchId: string | null;
        role: Role;
        permissions: string[];
      };
      requestId: string;
    }
  }
}
export {};
