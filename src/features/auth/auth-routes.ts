import express, { type Router } from "express";
import rateLimit from "express-rate-limit";
import {
  loginHandler,
  logoutHandler,
  rotateTokensHandler,
  setPasswordHandler,
  signupHandler,
} from "./auth-controller.js";
import { loginValidator, signupValidator } from "./auth-validator.js";
import { verifySetPasswordToken } from "../../middlewares/jwtHandler.js";

export const authRouter: Router = express.Router();

const authLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 3 : 1000,
  message: "Too many requests, please try again after 2 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 3 : 1000,
  message: "Too many requests, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

authRouter.post("/auth/signup", authLimiter, signupValidator, signupHandler);
authRouter.post("/auth/login", authLimiter, loginValidator, loginHandler);
authRouter.post("/auth/refresh", refreshLimiter, rotateTokensHandler);
authRouter.post("/auth/logout", logoutHandler);

authRouter.post(
  "/auth/set-password",
  verifySetPasswordToken,
  setPasswordHandler,
);
