import express, { type Router } from "express";
import {
  loginController,
  signupController,
} from "../controllers/auth-controller.js";
import {
  loginValidator,
  signupValidator,
} from "../validators/auth-validator.js";

export const router: Router = express.Router();

router.post("/api/auth/signup", signupValidator, signupController);
router.post("/api/auth/login", loginValidator, loginController);
