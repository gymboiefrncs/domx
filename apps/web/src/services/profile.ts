import { fetchWithAuth } from "@/lib/fetchWithAuth";

export const fetchProfile = async () => {
  const res = await fetchWithAuth(`http://localhost:8080/api/v1/profile/me`, {
    method: "GET",
    credentials: "include",
  });
  const data = await res.json();
  console.log("Response from fetchProfile:", data);
  if (!res.ok) throw new Error(data.errors[0].message);
  return data.data;
};
