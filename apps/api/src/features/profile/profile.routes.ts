import express, { type Router } from "express";
import rateLimit from "express-rate-limit";
import { handleGetProfile } from "./profile.controllers.js";
import { jwtHandler } from "@api/shared/middlewares/authenticate.js";
import { config } from "@api/shared/config.js";

export const profileRouter: Router = express.Router();

const profileLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: config.server.nodeEnv === "production" ? 60 : 1000,
  message: "Too many requests, please try again in a minute",
  standardHeaders: true,
  legacyHeaders: false,
});

profileRouter.get("/profile/me", profileLimiter, jwtHandler, handleGetProfile);
