import express, { type Router } from "express";
import { verificationController } from "../controllers/verification-controller.js";

export const verificationRouter: Router = express.Router();

verificationRouter.post("/api/verify-email", verificationController);
