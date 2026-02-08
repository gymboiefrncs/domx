import express, { type Router } from "express";
import rateLimit from "express-rate-limit";
import {
  resendVerificationController,
  verificationController,
} from "../controllers/verification-controller.js";
import {
  emailValidator,
  OTPValidator,
} from "../validators/verification-validator.js";

export const verificationRouter: Router = express.Router();

const verificationLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 1,
  message: "Too many requests, please try again after 2 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

verificationRouter.post("/verify-email", OTPValidator, verificationController);

verificationRouter.post(
  "/resend-otp",
  verificationLimiter,
  emailValidator,
  resendVerificationController,
);
