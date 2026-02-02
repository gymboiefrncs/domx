import express, { type Router } from "express";
import { signupController } from "../controllers/auth-controller.js";

export const router: Router = express.Router();

router.post("/api/auth/signup", signupController);
