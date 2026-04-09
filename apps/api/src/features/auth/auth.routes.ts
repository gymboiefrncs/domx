import express, { type Router } from "express";
import {
  loginHandler,
  logoutHandler,
  rotateTokensHandler,
  setInfoHandler,
  signupHandler,
} from "./auth.controllers.js";
import { verifySetInfoToken } from "@api/shared/middlewares/authenticate.js";
import { validateBody } from "@api/shared/middlewares/validate.js";
import { infoSchema, loginSchema, signupSchema } from "./auth.schemas.js";
import {
  signupLimiter,
  loginLimiter,
  refreshLimiter,
} from "@api/shared/middlewares/rateLimit.js";

const loginValidator = validateBody(loginSchema);
const signupValidator = validateBody(signupSchema);
const infoValidator = validateBody(infoSchema);

export const authRouter: Router = express.Router();

authRouter.post("/auth/signup", signupLimiter, signupValidator, signupHandler);
authRouter.post("/auth/login", loginLimiter, loginValidator, loginHandler);
authRouter.post("/auth/refresh", refreshLimiter, rotateTokensHandler);
authRouter.post("/auth/logout", logoutHandler);

authRouter.post(
  "/auth/set-info",
  infoValidator,
  verifySetInfoToken,
  setInfoHandler,
);
