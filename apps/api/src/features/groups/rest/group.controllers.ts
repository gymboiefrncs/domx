import type { RequestHandler } from "express";
import { createGroup, getMembers, getUserGroups } from "../group.services.js";
import type { GroupResponse, Params } from "../group.types.js";
import type { Group, Member } from "@domx/shared";

export const handleGetMembers: RequestHandler<
  Params,
  GroupResponse<Member[]>
> = async (req, res) => {
  const userId = req.user!.userId;
  const { groupId } = req.params;
  const members = await getMembers({ groupId, requesterId: userId });
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

export const handleCreateGroup: RequestHandler<
  Record<string, never>,
  GroupResponse<Group>
> = async (req, res) => {
  const userId = req.user!.userId;
  const newGroup = await createGroup({ groupName: req.body.groupName, userId });
  res.status(201).json({
    data: newGroup,
  });
};
