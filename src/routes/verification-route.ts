import express, { type Router } from "express";
import {
  resendVerificationController,
  verificationController,
} from "../controllers/verification-controller.js";
import {
  emailValidator,
  OTPValidator,
} from "../validators/verification-validator.js";

export const verificationRouter: Router = express.Router();

verificationRouter.post("/verify-email", OTPValidator, verificationController);
verificationRouter.post(
  "/resend-otp",
  emailValidator,
  resendVerificationController,
);
