import "express";
import type { Role } from "../common/types.js";
declare module "express" {
  interface Request {
    user?: {
      userId: string;
      role: Role;
    };
    setPwd?: {
      sub: string;
      purpose: "set-password";
    };
  }
}
