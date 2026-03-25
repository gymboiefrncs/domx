import express, { type Router } from "express";
import { jwtHandler } from "../../middlewares/jwtHandler.js";
import {
  ManageMemberValidator,
  groupValidator,
} from "../../middlewares/validate.js";
import {
  handleAddMember,
  handleChangeGroupName,
  handleCreateGroup,
  handleDemoteMember,
  handleGetGroups,
  handleKickMember,
  handleLeaveGroup,
  handlePromoteMember,
  handleUpdateSeen,
} from "./group-controller.js";

export const groupRouter: Router = express.Router();

groupRouter.get("/groups", jwtHandler, handleGetGroups);

groupRouter.patch(
  "/groups/:groupId/name",
  jwtHandler,
  groupValidator,
  handleChangeGroupName,
);

groupRouter.patch(
  "/groups/:groupId/seen",
  jwtHandler,
  groupValidator,
  handleUpdateSeen,
);

groupRouter.post("/groups", jwtHandler, groupValidator, handleCreateGroup);
groupRouter.post(
  "/groups/:groupId/add/:displayId",
  jwtHandler,
  ManageMemberValidator,
  handleAddMember,
);
groupRouter.delete(
  "/groups/:groupId/kick/:displayId",
  jwtHandler,
  ManageMemberValidator,
  handleKickMember,
);
groupRouter.patch(
  "/groups/:groupId/promote/:displayId",
  jwtHandler,
  ManageMemberValidator,
  handlePromoteMember,
);
groupRouter.patch(
  "/groups/:groupId/demote/:displayId",
  jwtHandler,
  ManageMemberValidator,
  handleDemoteMember,
);

groupRouter.delete(
  "/groups/:groupId/leave/:displayId",
  jwtHandler,
  ManageMemberValidator,
  handleLeaveGroup,
);
