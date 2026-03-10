import express, { type Router } from "express";
import rateLimit from "express-rate-limit";
import {
  resendOtpHandler,
  verificationHandler,
} from "./verification-controller.js";
import { emailValidator, otpValidator } from "../../middlewares/validate.js";

export const verificationRouter: Router = express.Router();

const verificationLimiter = rateLimit({
  windowMs: 3 * 60 * 1000,
  max: 2,
  message: "Too many requests, please try again after 3 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

verificationRouter.post("/verify-email", otpValidator, verificationHandler);

verificationRouter.post(
  "/resend-otp",
  verificationLimiter,
  emailValidator,
  resendOtpHandler,
);
