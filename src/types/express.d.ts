import "express";
import type { Role } from "../common/types.ts";
declare module "express" {
  interface Request {
    user?: {
      userId: string;
      role: Role;
    };
  }
}
