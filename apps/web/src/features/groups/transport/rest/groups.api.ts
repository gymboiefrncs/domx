import type { Group, Member } from "@domx/shared";
import { httpClient } from "@/shared/lib/api/http.client";
import type { ApiResponse } from "@/shared/types";

export const createGroup = async (name: string): Promise<Group> => {
  const res = await httpClient.post<ApiResponse<Group>>("/groups", {
    groupName: name,
  });
  return res!.data;
};

export const fetchMyGroups = async (): Promise<Group[]> => {
  const res = await httpClient.get<ApiResponse<Group[]>>("/groups");
  return res!.data;
};

export const addMemberToGroup = async (
  groupId: string,
  displayId: string,
): Promise<Member> => {
  const res = await httpClient.post<ApiResponse<Member>>(
    `/groups/${groupId}/add/${displayId}`,
    { displayId },
  );
  return res!.data;
};

export const fetchGroupMembers = async (groupId: string): Promise<Member[]> => {
  const res = await httpClient.get<ApiResponse<Member[]>>(
    `/groups/${groupId}/members`,
  );
  return res!.data;
};

export const deleteGroup = async (groupId: string): Promise<void> => {
  await httpClient.delete(`/groups/${groupId}`);
};

export const markGroupAsSeen = async (groupId: string): Promise<void> => {
  await httpClient.patch(`/groups/${groupId}/seen`);
};

export const changeGroupName = async (
  groupId: string,
  newName: string,
): Promise<void> => {
  await httpClient.patch(`/groups/${groupId}/name`, {
    groupName: newName,
  });
};
