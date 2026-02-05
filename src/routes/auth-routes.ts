import express, { type Router } from "express";
import {
  loginController,
  signupController,
} from "../controllers/auth-controller.js";
import {
  loginValidator,
  signupValidator,
} from "../validators/auth-validator.js";

export const authRouter: Router = express.Router();

authRouter.post("/api/auth/signup", signupValidator, signupController);
authRouter.post("/api/auth/login", loginValidator, loginController);
