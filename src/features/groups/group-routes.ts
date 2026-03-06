import express, { type Router } from "express";
import { jwtHandler } from "../../middlewares/jwtHandler.js";
import {
  ManageMemberValidator,
  groupValidator,
} from "../../middlewares/validate.js";
import {
  handleAddMember,
  handleCreateGroup,
  handleKickMember,
} from "./group-controller.js";

export const groupRouter: Router = express.Router();

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
