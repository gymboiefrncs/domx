import express, { type Router } from "express";
import rateLimit from "express-rate-limit";
import {
  resendVerificationController,
  verificationHandler,
} from "../controllers/verification-controller.js";
import {
  emailValidator,
  OTPValidator,
} from "../validators/verification-validator.js";

export const verificationRouter: Router = express.Router();

const verificationLimiter = rateLimit({
  windowMs: 3 * 60 * 1000,
  max: 2,
  message: "Too many requests, please try again after 3 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

verificationRouter.post("/verify-email", OTPValidator, verificationHandler);

verificationRouter.post(
  "/resend-otp",
  verificationLimiter,
  emailValidator,
  resendVerificationController,
);
