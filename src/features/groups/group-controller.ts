import type { Request, Response, NextFunction } from "express";
import { addMember, createGroup, kickMember } from "./group-service.js";
import type { Params } from "./group-types.js";

export const handleCreateGroup = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const result = await createGroup(req.body.groupName, userId);
    res.status(201).json({
      success: result.ok,
      message: result.message,
      data: result.ok ? result.data : null,
    });
  } catch (error) {
    next(error);
  }
};

export const handleAddMember = async (
  req: Request<Params>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { displayId, groupId } = req.params;
    const requesterId = req.user!.userId;

    const result = await addMember(groupId, displayId, requesterId);
    res.status(200).json({
      success: result.ok,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const handleKickMember = async (
  req: Request<Params>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { displayId, groupId } = req.params;
    const requesterId = req.user!.userId;
    const result = await kickMember(groupId, displayId, requesterId);
    res.status(200).json({
      success: result.ok,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};
