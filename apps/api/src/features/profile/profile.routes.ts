import express, { type Router } from "express";
import {
  handleDeleteProfile,
  handleGetProfile,
} from "./profile.controllers.js";
import { jwtHandler } from "@api/shared/middlewares/authenticate.js";
import {
  deleteProfileLimiter,
  readProfileLimiter,
} from "@api/shared/middlewares/rateLimit.js";

export const profileRouter: Router = express.Router();
profileRouter.use(jwtHandler);

profileRouter.get("/profile/me", readProfileLimiter, handleGetProfile);
profileRouter.delete("/profile/me", deleteProfileLimiter, handleDeleteProfile);
