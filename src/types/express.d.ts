import "express";
import type { Role } from "../common/types.js";
declare module "express" {
  interface Request {
    user?: {
      userId: string;
      role: Role;
    };
    setInfo?: {
      sub: string;
      purpose: "set-info";
    };
  }
}
