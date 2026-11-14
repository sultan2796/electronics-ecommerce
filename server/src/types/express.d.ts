import { Role } from "@prisma/client";
import { Permission } from "../config/permissions";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: Role; permissions: Permission[] };
    }
  }
}

export {};
