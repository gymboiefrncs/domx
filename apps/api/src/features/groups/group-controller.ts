import type { Request, Response, NextFunction } from "express";
import {
  addMember,
  changeGroupName,
  createGroup,
  demoteMember,
  getGroupMembers,
  getUserGroups,
  kickMember,
  leaveMember,
  promoteMember,
  updateLastSeen,
} from "./group-service.js";
import type { Params } from "./group-types.js";

export const handleGetMembers = async (
  req: Request<Params>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { groupId } = req.params;
    const result = await getGroupMembers(groupId);
    res.status(200).json({
      success: result.ok,
      message: result.message,
      data: result.ok ? result.data : null,
    });
  } catch (error) {
    next(error);
  }
};

export const handleGetGroups = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const result = await getUserGroups(userId);
    res.status(200).json({
      success: result.ok,
      message: result.message,
      data: result.ok ? result.data : null,
    });
  } catch (error) {
    next(error);
  }
};

export const handleUpdateSeen = async (
  req: Request<Params>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { groupId } = req.params;
    const result = await updateLastSeen(groupId, userId);
    res.status(200).json({
      success: result.ok,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const handleCreateGroup = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
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

export const handleChangeGroupName = async (
  req: Request<Params>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { groupId } = req.params;
    const { groupName } = req.body;
    const requesterId = req.user!.userId;

    const result = await changeGroupName(groupId, groupName, requesterId);
    res.status(200).json({
      success: result.ok,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const handleAddMember = async (
  req: Request<Params>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { displayId, groupId } = req.params;
    const requesterId = req.user!.userId;

    const result = await addMember(groupId, displayId, requesterId);
    res.status(200).json({
      success: result.ok,
      message: result.message,
      data: result.ok ? result.data : null,
    });
  } catch (error) {
    next(error);
  }
};

export const handleKickMember = async (
  req: Request<Params>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
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

export const handlePromoteMember = async (
  req: Request<Params>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { displayId, groupId } = req.params;
    const requesterId = req.user!.userId;
    const result = await promoteMember(groupId, displayId, requesterId);
    res.status(200).json({
      success: result.ok,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const handleDemoteMember = async (
  req: Request<Params>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { displayId, groupId } = req.params;
    const requesterId = req.user!.userId;
    const result = await demoteMember(groupId, displayId, requesterId);
    res.status(200).json({
      success: result.ok,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const handleLeaveGroup = async (
  req: Request<Params>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { displayId, groupId } = req.params;
    const requesterId = req.user!.userId;
    const result = await leaveMember(groupId, displayId, requesterId);
    res.status(200).json({
      success: result.ok,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};
