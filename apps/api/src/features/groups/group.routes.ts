import express, { type Router } from "express";
import rateLimit from "express-rate-limit";
import { jwtHandler } from "@api/shared/middlewares/authenticate.js";
import {
  manageMemberValidator,
  groupValidator,
  groupParamsValidator,
} from "@api/shared/middlewares/validate.js";
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
import { config } from "@api/shared/config.js";

export const groupRouter: Router = express.Router();

const groupLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: config.server.nodeEnv === "production" ? 120 : 1000,
  message: "Too many requests, please try again in a minute",
  standardHeaders: true,
  legacyHeaders: false,
});

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

groupRouter.post("/groups", jwtHandler, groupValidator, handleCreateGroup);
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
