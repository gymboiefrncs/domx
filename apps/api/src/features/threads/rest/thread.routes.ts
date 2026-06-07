import express, { type Router } from "express";
import { jwtHandler } from "@api/shared/middlewares/authenticate.js";
import { validateParams } from "@api/shared/middlewares/validate.js";
import { handleGetGroupThreads } from "./thread.controllers.js";
import { ThreadParamsSchema } from "../thread.schemas.js";
import { readThreadLimiter } from "@api/shared/middlewares/rateLimit.js";

const threadParamsValidator = validateParams(ThreadParamsSchema);

export const threadRouter: Router = express.Router();
threadRouter.use(jwtHandler);

threadRouter.get(
  "/groups/:groupId/threads",
  readThreadLimiter,
  threadParamsValidator,
  handleGetGroupThreads,
);
