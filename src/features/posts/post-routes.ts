import express, { type Router } from "express";
import { jwtHandler } from "../../middlewares/jwtHandler.js";
import {
  postValidator,
  postParamsValidator,
} from "../../middlewares/validate.js";
import { handleCreatePost } from "./post-controller.js";

export const postRouter: Router = express.Router();

postRouter.post(
  "/groups/:groupId/posts",
  jwtHandler,
  postParamsValidator,
  postValidator,
  handleCreatePost,
);
