import express, { type Router } from "express";
import rateLimit from "express-rate-limit";
import { jwtHandler } from "@api/middlewares/jwtHandler.js";
import {
  postValidator,
  postParamsValidator,
  editPostParamsValidator,
  deletePostParamsValidator,
} from "@api/middlewares/validate.js";
import {
  handleCreatePost,
  handleDeletePost,
  handleEditPost,
  handleGetPosts,
} from "./post.controllers.js";

export const postRouter: Router = express.Router();

const postLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 120 : 1000,
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
