import { authRouter } from "@api/features/auth/auth-routes.js";
import { groupRouter } from "@api/features/groups/group-routes.js";
import { postRouter } from "@api/features/posts/post-routes.js";
import { verificationRouter } from "@api/features/verification/verification-routes.js";
import { profileRouter } from "@api/features/profile/profile-routes.js";
import express, { type Router } from "express";

export const routes: Router = express.Router();

routes.use("/api/v1", authRouter);
routes.use("/api/v1", verificationRouter);
routes.use("/api/v1", groupRouter);
routes.use("/api/v1", postRouter);
routes.use("/api/v1", profileRouter);
