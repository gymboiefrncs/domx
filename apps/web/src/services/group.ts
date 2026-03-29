import { fetchWithAuth } from "@/lib/fetchWithAuth";
import type { GroupDetail } from "@domx/shared";

export const createGroup = async (name: string): Promise<GroupDetail> => {
  const res = await fetchWithAuth("http://localhost:8080/api/v1/groups", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ groupName: name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.errors[0].message);
  return data.data;
};

export const changeGroupName = async (groupId: string, newName: string) => {
  const res = await fetchWithAuth(
    `http://localhost:8080/api/v1/groups/${groupId}/name`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ groupName: newName }),
    },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.errors[0].message);
  return data;
};

export const fetchMyGroups = async (): Promise<GroupDetail[]> => {
  const res = await fetchWithAuth("http://localhost:8080/api/v1/groups", {
    method: "GET",
    credentials: "include",
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.errors[0].message);
  return data.data;
};

export const addMemberToGroup = async (groupId: string, displayId: string) => {
  const res = await fetchWithAuth(
    `http://localhost:8080/api/v1/groups/${groupId}/add/${displayId}`,
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
  if (!res.ok) throw new Error(data.errors[0].message);
  console.log(data);
  return data.data;
};

export const fetchGroupMembers = async (groupId: string) => {
  const res = await fetchWithAuth(
    `http://localhost:8080/api/v1/groups/${groupId}/members`,
    {
      method: "GET",
      credentials: "include",
    },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.errors[0].message);
  console.log(groupId);
  return data.data;
};

export const deleteGroup = async (groupId: string) => {
  const res = await fetchWithAuth(
    `http://localhost:8080/api/v1/groups/${groupId}/delete`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.errors[0].message);
  return data;
};
