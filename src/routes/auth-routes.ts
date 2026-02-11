import express, { type Router } from "express";
import rateLimit from "express-rate-limit";
import {
  loginController,
  refreshController,
  signupController,
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

authRouter.post("/auth/signup", authLimiter, signupValidator, signupController);
authRouter.post("/auth/login", authLimiter, loginValidator, loginController);
authRouter.post("/auth/refresh", refreshLimiter, refreshController);
