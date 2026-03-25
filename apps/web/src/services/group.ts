import { fetchWithAuth } from "@/lib/fetchWithAuth";
import type { CreateGroup, GroupDetail } from "@domx/shared";

export const createGroup = async (name: string): Promise<CreateGroup> => {
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
  return data;
};
