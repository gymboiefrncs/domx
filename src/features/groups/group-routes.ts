import express, { type Router } from "express";
import { jwtHandler } from "../../middlewares/jwtHandler.js";
import { groupValidator } from "../../middlewares/validate.js";
import { handleCreateGroup } from "./group-controller.js";

export const groupRouter: Router = express.Router();

groupRouter.post("/groups", jwtHandler, groupValidator, handleCreateGroup);
