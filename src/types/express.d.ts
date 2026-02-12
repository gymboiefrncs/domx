declare namespace Express {
  interface Request {
    user?: {
      userId: string;
      role: import("../common/types.js").Role;
    };
  }
}
