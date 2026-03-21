import { fetchWithAuth } from "@/lib/fetchWithAuth";

export const createGroup = async (name: string) => {
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

export const fetchMyGroups = async () => {
  const res = await fetchWithAuth("http://localhost:8080/api/v1/groups", {
    method: "GET",
    credentials: "include",
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.errors[0].message);
  return data.data;
};
