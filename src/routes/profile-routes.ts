import express, { type Router } from "express";
import { jwtHandler } from "../middlewares/jwtHandler.js";
import { profileController } from "../controllers/profile-controllers.js";

export const profileRouter: Router = express.Router();

profileRouter.get("/me", jwtHandler, profileController);
