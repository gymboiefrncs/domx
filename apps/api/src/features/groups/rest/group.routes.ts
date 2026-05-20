import express, { type Router } from "express";
import { jwtHandler } from "@api/shared/middlewares/authenticate.js";
import {
  handleChangeGroupName,
  handleCreateGroup,
  handleGetGroups,
  handleGetMembers,
  handleUpdateSeen,
  handleDeleteGroup,
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

groupRouter.use(groupLimiter);

groupRouter.get("/groups", jwtHandler, handleGetGroups);

groupRouter.get(
  "/groups/:groupId/members",
  jwtHandler,
  groupParamsValidator,
  handleGetMembers,
);

groupRouter.patch(
  "/groups/:groupId/name",
  jwtHandler,
  groupValidator,
  handleChangeGroupName,
);

groupRouter.patch(
  "/groups/:groupId/seen",
  jwtHandler,
  groupParamsValidator,
  handleUpdateSeen,
);

groupRouter.post(
  "/groups",
  createGroupLimiter,
  jwtHandler,
  groupValidator,
  handleCreateGroup,
);

groupRouter.delete(
  "/groups/:groupId",
  jwtHandler,
  groupParamsValidator,
  handleDeleteGroup,
);
