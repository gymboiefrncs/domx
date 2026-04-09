import express, { type Router } from "express";
import {
  handleDeleteProfile,
  handleGetProfile,
} from "./profile.controllers.js";
import { jwtHandler } from "@api/shared/middlewares/authenticate.js";
import { profileLimiter } from "@api/shared/middlewares/rateLimit.js";

export const profileRouter: Router = express.Router();

profileRouter.get("/profile/me", profileLimiter, jwtHandler, handleGetProfile);
profileRouter.delete(
  "/profile/me",
  profileLimiter,
  jwtHandler,
  handleDeleteProfile,
);
