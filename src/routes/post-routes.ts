import express from "express";
import type { Router } from "express";
import { jwtHandler } from "../middlewares/jwtHandler.js";
import { postController } from "../controllers/post-controller.js";
import { postValidator } from "../validators/post-validator.js";

export const postRouter: Router = express.Router();

postRouter.post("/post", jwtHandler, postValidator, postController);
