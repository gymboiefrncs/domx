import { httpClient } from "@/shared/lib/api/http.client";
import type { ApiResponse } from "@/shared/types";
import type { Group, Member } from "@domx/shared";

export const fetchGroups = async (): Promise<Group[]> => {
  const res = await httpClient.get<ApiResponse<Group[]>>("/groups");
  return res!.data;
};

export const createGroup = async (groupName: string): Promise<Group> => {
  const res = await httpClient.post<ApiResponse<Group>>("/groups", {
    groupName,
  });
  return res!.data;
};

export const fetchGroupMembers = async (groupId: string): Promise<Member[]> => {
  const res = await httpClient.get<ApiResponse<Member[]>>(
    `/groups/${groupId}/members`,
  );
  return res!.data;
};
