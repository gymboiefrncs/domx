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
} from "./post-controller.js";

export const postRouter: Router = express.Router();

postRouter.post(
  "/groups/:groupId/posts",
  jwtHandler,
  postParamsValidator,
  postValidator,
  handleCreatePost,
);

postRouter.patch(
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
