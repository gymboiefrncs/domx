import type { RequestHandler } from "express";
import {
  createGroup,
  getGroupMembers,
  getUserGroups,
  updateLastSeen,
} from "../group.services.js";
import type { GroupResponse, Params } from "../group.types.js";
import type { Group, Member } from "@domx/shared";

export const handleGetMembers: RequestHandler<
  Params,
  GroupResponse<Member[]>
> = async (req, res) => {
  const userId = req.user!.userId;
  const { groupId } = req.params;
  const members = await getGroupMembers(groupId, userId);
  res.status(200).json({
    data: members,
  });
};

export const handleGetGroups: RequestHandler<
  Record<string, never>,
  GroupResponse<Group[]>
> = async (req, res) => {
  const userId = req.user!.userId;
  const groups = await getUserGroups(userId);
  res.status(200).json({
    data: groups,
  });
};

export const handleUpdateSeen: RequestHandler<Params, never> = async (
  req,
  res,
) => {
  const userId = req.user!.userId;
  const { groupId } = req.params;
  await updateLastSeen(groupId, userId);
  res.status(204).send();
};

export const handleCreateGroup: RequestHandler<
  Record<string, never>,
  GroupResponse<Group>
> = async (req, res) => {
  const userId = req.user!.userId;
  const newGroup = await createGroup(req.body.groupName, userId);
  res.status(201).json({
    data: newGroup,
  });
};
