import { fetchWithAuth } from "@/lib/fetchWithAuth";
import type { Post, PostDetails } from "@domx/shared";

export const fetchMessages = async (
  groupId: string,
): Promise<PostDetails[]> => {
  const res = await fetchWithAuth(
    `http://localhost:8080/api/v1/groups/${groupId}/posts`,
    {
      method: "GET",
      credentials: "include",
    },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.errors[0].message);

  return data.data;
};

export const createPost = async (
  groupId: string,
  body: string,
  title: string,
): Promise<Post> => {
  const res = await fetchWithAuth(
    `http://localhost:8080/api/v1/groups/${groupId}/posts`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ body, title }),
    },
  );
  const data = await res.json();

  if (!res.ok) throw new Error(data.errors[0].message);
  return data.data;
};
