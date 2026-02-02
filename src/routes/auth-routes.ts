import express, { type Router } from "express";
import { signupController } from "../controllers/auth-controller.js";
import { signupValidator } from "../validators/auth-validator.js";

export const router: Router = express.Router();

router.post("/api/auth/signup", signupValidator, signupController);
