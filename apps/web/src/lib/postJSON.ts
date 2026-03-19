import { API_BASE_URL } from "@/config";
import type { serviceResponse } from "@/shared";

export const postJSON = async (
  path: string,
  data: object,
): Promise<serviceResponse> => {
  const result = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const resultData = await result.json();
  if (!result.ok) throw new Error(resultData.message);

  return resultData;
};
