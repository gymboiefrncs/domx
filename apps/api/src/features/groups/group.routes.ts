import express, { type Router } from "express";
import { jwtHandler } from "@api/shared/middlewares/authenticate.js";
import {
  handleAddMember,
  handleChangeGroupName,
  handleCreateGroup,
  handleDemoteMember,
  handleGetGroups,
  handleGetMembers,
  handleKickMember,
  handleLeaveGroup,
  handlePromoteMember,
  handleUpdateSeen,
  handleDeleteGroup,
} from "./group.controllers.js";
import {
  validateBody,
  validateParams,
} from "@api/shared/middlewares/validate.js";
import {
  GroupParamsSchema,
  ManageMemberSchema,
  GroupSchema,
} from "./group.schemas.js";
import {
  groupLimiter,
  createGroupLimiter,
} from "@api/shared/middlewares/rateLimit.js";

const manageMemberValidator = validateParams(ManageMemberSchema);
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
groupRouter.post(
  "/groups/:groupId/add/:displayId",
  jwtHandler,
  manageMemberValidator,
  handleAddMember,
);

groupRouter.post(
  "/groups/:groupId/members/:displayId",
  jwtHandler,
  manageMemberValidator,
  handleAddMember,
);
groupRouter.delete(
  "/groups/:groupId/kick/:displayId",
  jwtHandler,
  manageMemberValidator,
  handleKickMember,
);

// REST alias kept alongside legacy route for compatibility
groupRouter.delete(
  "/groups/:groupId/members/:displayId",
  jwtHandler,
  manageMemberValidator,
  handleKickMember,
);
groupRouter.patch(
  "/groups/:groupId/promote/:displayId",
  jwtHandler,
  manageMemberValidator,
  handlePromoteMember,
);
groupRouter.patch(
  "/groups/:groupId/demote/:displayId",
  jwtHandler,
  manageMemberValidator,
  handleDemoteMember,
);

groupRouter.delete(
  "/groups/:groupId/leave",
  jwtHandler,
  groupParamsValidator,
  handleLeaveGroup,
);

groupRouter.delete(
  "/groups/:groupId",
  jwtHandler,
  groupParamsValidator,
  handleDeleteGroup,
);
