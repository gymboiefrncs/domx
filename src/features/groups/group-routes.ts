import express, { type Router } from "express";
import { jwtHandler } from "../../middlewares/jwtHandler.js";
import {
  addMemberValidator,
  groupValidator,
} from "../../middlewares/validate.js";
import { handleAddMember, handleCreateGroup } from "./group-controller.js";

export const groupRouter: Router = express.Router();

groupRouter.post("/groups", jwtHandler, groupValidator, handleCreateGroup);
groupRouter.post(
  "/groups/:groupId/add/:displayId",
  jwtHandler,
  addMemberValidator,
  handleAddMember,
);
