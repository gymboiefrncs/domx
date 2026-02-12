import { authRouter } from "./auth-routes.js";
import { postRouter } from "./post-routes.js";
import { verificationRouter } from "./verification-route.js";
import express, { type Router } from "express";

export const routes: Router = express.Router();

routes.use("/api/v1", authRouter);
routes.use("/api/v1", verificationRouter);

routes.use("/api/v1", postRouter);
