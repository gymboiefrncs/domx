import { fetchWithAuth } from "@/lib/fetchWithAuth";

export const fetchMessages = async (groupId: string) => {
  const res = await fetchWithAuth(
    `http://localhost:8080/api/v1/groups/${groupId}/posts`,
    {
      method: "GET",
      credentials: "include",
    },
  );
  const data = await res.json();
  console.log("Response from fetchMessages:", data);
  if (!res.ok) throw new Error(data.errors[0].message);
  return data.data;
};
