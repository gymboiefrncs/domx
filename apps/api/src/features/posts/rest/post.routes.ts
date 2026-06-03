import express, { type Router } from "express";
import { jwtHandler } from "@api/shared/middlewares/authenticate.js";
import { validateParams } from "@api/shared/middlewares/validate.js";
import { handleGetPosts } from "./post.controllers.js";
import { PostParamsSchema } from "../post.schemas.js";
import { readPostLimiter } from "@api/shared/middlewares/rateLimit.js";

const postParamsValidator = validateParams(PostParamsSchema);

export const postRouter: Router = express.Router();
postRouter.use(jwtHandler);

postRouter.get(
  "/groups/:groupId/posts",
  readPostLimiter,
  postParamsValidator,
  handleGetPosts,
);
