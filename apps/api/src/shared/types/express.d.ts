declare module "express-serve-static-core" {
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

export {};
