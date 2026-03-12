import express, { type Router } from "express";
import { jwtHandler } from "../../middlewares/jwtHandler.js";
import {
  postValidator,
  postParamsValidator,
  editPostParamsValidator,
  deletePostParamsValidator,
} from "../../middlewares/validate.js";
import {
  handleCreatePost,
  handleDeletePost,
  handleEditPost,
  handleGetPosts,
} from "./post-controller.js";

export const postRouter: Router = express.Router();

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
