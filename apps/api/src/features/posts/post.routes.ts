import express, { type Router } from "express";
import rateLimit from "express-rate-limit";
import { jwtHandler } from "@api/shared/middlewares/authenticate.js";
import {
  postValidator,
  postParamsValidator,
  editPostParamsValidator,
  deletePostParamsValidator,
} from "@api/shared/middlewares/validate.js";
import {
  handleCreatePost,
  handleDeletePost,
  handleEditPost,
  handleGetPosts,
} from "./post.controllers.js";
import { config } from "@api/shared/config.js";

export const postRouter: Router = express.Router();

const postLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: config.server.nodeEnv === "production" ? 120 : 1000,
  message: "Too many requests, please try again in a minute",
  standardHeaders: true,
  legacyHeaders: false,
});

postRouter.use(postLimiter);

postRouter.get(
  "/groups/:groupId/posts",
  jwtHandler,
  postParamsValidator,
  handleGetPosts,
);

postRouter.post(
  "/groups/:groupId/posts",
  jwtHandler,
  postParamsValidator,
  postValidator,
  handleCreatePost,
);

postRouter.put(
  "/groups/:groupId/posts/:postId",
  jwtHandler,
  editPostParamsValidator,
  postValidator,
  handleEditPost,
);

postRouter.delete(
  "/groups/:groupId/posts/:postId",
  jwtHandler,
  deletePostParamsValidator,
  handleDeletePost,
);
