import { authRouter } from "../features/auth/auth-routes.js";
import { postRouter } from "../features/post/post-routes.js";
import { verificationRouter } from "../features/verification/verification-routes.js";
import express, { type Router } from "express";
import { profileRouter } from "../features/profile/profile-routes.js";

export const routes: Router = express.Router();

routes.use("/api/v1", authRouter);
routes.use("/api/v1", verificationRouter);

routes.use("/api/v1", postRouter);

routes.use("/api/v1", profileRouter);
