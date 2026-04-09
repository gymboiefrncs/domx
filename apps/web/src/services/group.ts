import { fetchWithAuth } from "@/lib/fetchWithAuth";
import type { GroupDetail, NewMember } from "@domx/shared";
import { API_BASE_URL } from "@/config";
import { getApiErrorMessage } from "@/utils/error";

export const createGroup = async (name: string): Promise<GroupDetail> => {
  const res = await fetchWithAuth(`${API_BASE_URL}/groups`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ groupName: name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(getApiErrorMessage(data));
  return data.data;
};

export const changeGroupName = async (groupId: string, newName: string) => {
  const res = await fetchWithAuth(`${API_BASE_URL}/groups/${groupId}/name`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ groupName: newName }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(getApiErrorMessage(data));
  return data;
};

export const fetchMyGroups = async (): Promise<GroupDetail[]> => {
  const res = await fetchWithAuth(`${API_BASE_URL}/groups`, {
    method: "GET",
    credentials: "include",
  });

  const data = await res.json();
  if (!res.ok) throw new Error(getApiErrorMessage(data));
  return data.data;
};

export const addMemberToGroup = async (
  groupId: string,
  displayId: string,
): Promise<NewMember> => {
  const res = await fetchWithAuth(
    `${API_BASE_URL}/groups/${groupId}/add/${displayId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ displayId }),
    },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(getApiErrorMessage(data));
  return data.data;
};

export const fetchGroupMembers = async (groupId: string) => {
  const res = await fetchWithAuth(`${API_BASE_URL}/groups/${groupId}/members`, {
    method: "GET",
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(getApiErrorMessage(data));
  return data.data;
};

export const deleteGroup = async (groupId: string) => {
  const res = await fetchWithAuth(`${API_BASE_URL}/groups/${groupId}`, {
    method: "DELETE",
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(getApiErrorMessage(data));
  return data;
};

export const markGroupAsSeen = async (groupId: string): Promise<void> => {
  const res = await fetchWithAuth(`${API_BASE_URL}/groups/${groupId}/seen`, {
    method: "PATCH",
    credentials: "include",
  });

  const data = await res.json();
  if (!res.ok) throw new Error(getApiErrorMessage(data));
};
