import express, { type Router } from "express";
import rateLimit from "express-rate-limit";
import { handleGetProfile } from "./profile.controllers.js";
import { jwtHandler } from "@api/middlewares/jwtHandler.js";

export const profileRouter: Router = express.Router();

const profileLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 60 : 1000,
  message: "Too many requests, please try again in a minute",
  standardHeaders: true,
  legacyHeaders: false,
});

profileRouter.get("/profile/me", profileLimiter, jwtHandler, handleGetProfile);
