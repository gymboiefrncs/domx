import express, { type Router } from "express";
import rateLimit from "express-rate-limit";
import {
  loginHandler,
  logoutHandler,
  rotateTokensHandler,
  signupHandler,
} from "../controllers/auth-controller.js";
import {
  loginValidator,
  signupValidator,
} from "../validators/auth-validator.js";

export const authRouter: Router = express.Router();

const authLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 3,
  message: "Too many requests, please try again after 2 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many requests, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

authRouter.post("/auth/signup", authLimiter, signupValidator, signupHandler);
authRouter.post("/auth/login", authLimiter, loginValidator, loginHandler);
authRouter.post("/auth/refresh", refreshLimiter, rotateTokensHandler);
authRouter.post("/auth/logout", logoutHandler);
