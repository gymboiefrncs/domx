import { authRouter } from "../features/auth/auth-routes.js";
import { groupRouter } from "../features/groups/group-routes.js";
import { verificationRouter } from "../features/verification/verification-routes.js";
import express, { type Router } from "express";

export const routes: Router = express.Router();

routes.use("/api/v1", authRouter);
routes.use("/api/v1", verificationRouter);
routes.use("/api/v1", groupRouter);
