import express, { type Router } from "express";
import { jwtHandler } from "@api/shared/middlewares/authenticate.js";
import { validateParams } from "@api/shared/middlewares/validate.js";
import { handleGetPosts } from "./post.controllers.js";
import { PostParamsSchema } from "../post.schemas.js";
import { postLimiter } from "@api/shared/middlewares/rateLimit.js";

const postParamsValidator = validateParams(PostParamsSchema);

export const postRouter: Router = express.Router();

postRouter.use(postLimiter);

postRouter.get(
  "/groups/:groupId/posts",
  jwtHandler,
  postParamsValidator,
  handleGetPosts,
);
