import express, { type Router } from "express";
import { jwtHandler } from "@api/shared/middlewares/authenticate.js";
import {
  handleCreateGroup,
  handleGetGroups,
  handleGetMembers,
} from "./group.controllers.js";
import {
  validateBody,
  validateParams,
} from "@api/shared/middlewares/validate.js";
import { GroupParamsSchema, GroupSchema } from "../group.schemas.js";
import {
  groupLimiter,
  createGroupLimiter,
} from "@api/shared/middlewares/rateLimit.js";

const groupParamsValidator = validateParams(GroupParamsSchema);
const groupValidator = validateBody(GroupSchema);

export const groupRouter: Router = express.Router();
groupRouter.use(jwtHandler);

groupRouter.get("/groups", groupLimiter, handleGetGroups);
groupRouter.get(
  "/groups/:groupId/members",
  groupParamsValidator,
  groupLimiter,
  handleGetMembers,
);
groupRouter.post(
  "/groups",
  createGroupLimiter,
  groupValidator,
  handleCreateGroup,
);
