import "express";
import type { Role } from "./types.ts";
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
