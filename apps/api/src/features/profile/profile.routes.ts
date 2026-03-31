import express, { type Router } from "express";
import { handleGetProfile } from "./profile.controllers.js";
import { jwtHandler } from "@api/middlewares/jwtHandler.js";

export const profileRouter: Router = express.Router();

profileRouter.get("/profile/me", jwtHandler, handleGetProfile);
