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

export const authRouter: Router = express.Router();

authRouter.post(
  "/auth/signup",
  validateBody(signupSchema),
  signupLimiter,
  signupHandler,
);
authRouter.post(
  "/auth/login",
  validateBody(loginSchema),
  loginLimiter,
  loginHandler,
);
authRouter.post("/auth/logout", logoutHandler);
authRouter.post("/auth/refresh", refreshLimiter, rotateTokensHandler);
authRouter.post(
  "/auth/set-info",
  validateBody(infoSchema),
  verifySetInfoToken,
  setInfoHandler,
);
