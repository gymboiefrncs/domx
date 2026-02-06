import express, { type Router } from "express";
import {
  resendVerificationController,
  verificationController,
} from "../controllers/verification-controller.js";

export const verificationRouter: Router = express.Router();

verificationRouter.post("/verify-email", verificationController);
verificationRouter.post("/resend-otp", resendVerificationController);
