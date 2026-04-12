import type { Request, Response, NextFunction } from "express";
import {
  addMember,
  changeGroupName,
  createGroup,
  getGroupMembers,
  getUserGroups,
  updateLastSeen,
  deleteGroupById,
  promoteMember,
  demoteMember,
  kickMember,
} from "./group.services.js";
import type { Params } from "./group.types.js";
import { broadcastToGroup } from "./group-helper.js";
import type { ChatSocket } from "../posts/index.js";

export const handleGetMembers = async (
  req: Request<Params>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { groupId } = req.params;
    const result = await getGroupMembers(groupId, userId);
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
): Promise<void> => {
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

export const handleDeleteGroup = async (
  req: Request<Params>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { groupId } = req.params;
    const requesterId = req.user!.userId;
    const result = await deleteGroupById(groupId, requesterId);
    res.status(200).json({
      success: result.ok,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const handlePromoteMember = async (
  data: unknown,
  socket: ChatSocket,
  rooms: Map<string, Set<ChatSocket>>,
) => {
  const { groupId, displayId } = data as { groupId: string; displayId: string };
  const result = await promoteMember(groupId, displayId, socket.userId);
  const payload = JSON.stringify({
    type: "memberPromoted",
    message: result.message,
    data: { groupId, displayId },
  });
  socket.send(payload);
  broadcastToGroup(rooms, groupId, payload);
};

export const handleDemoteMember = async (
  data: unknown,
  socket: ChatSocket,
  rooms: Map<string, Set<ChatSocket>>,
) => {
  const { groupId, displayId } = data as { groupId: string; displayId: string };
  const result = await demoteMember(groupId, displayId, socket.userId);
  const payload = JSON.stringify({
    type: "memberDemoted",
    message: result.message,
    data: { groupId, displayId },
  });
  socket.send(payload);
  broadcastToGroup(rooms, groupId, payload);
};

export const handleKickMember = async (
  data: unknown,
  socket: ChatSocket,
  rooms: Map<string, Set<ChatSocket>>,
) => {
  const { groupId, displayId } = data as { groupId: string; displayId: string };
  const result = await kickMember(groupId, displayId, socket.userId);
  const payload = JSON.stringify({
    type: "memberKicked",
    message: result.message,
    data: { groupId, displayId },
  });
  socket.send(payload);
  broadcastToGroup(rooms, groupId, payload);
};

export const handleLeaveGroup = async (
  data: unknown,
  socket: ChatSocket,
  rooms: Map<string, Set<ChatSocket>>,
) => {
  const { groupId } = data as { groupId: string };
  const result = await kickMember(groupId, socket.userId, socket.userId);
  const payload = JSON.stringify({
    type: "groupLeft",
    message: result.message,
    data: { groupId },
  });
  socket.send(payload);
  broadcastToGroup(rooms, groupId, payload);
};
