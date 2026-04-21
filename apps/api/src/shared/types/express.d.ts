import "express";
declare module "express" {
  interface Request {
    user?: {
      userId: string;
    };
    setInfo?: {
      sub: string;
      purpose: "set-info";
    };
  }
}
