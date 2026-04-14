/**
 * fetchWithAuth is a wrapper around the fetch function that automatically
 * handles token refresh when a 401 Unauthorized response is received. It ensures
 * that only one refresh request is made at a time, and subsequent requests wait
 * for the refresh to complete before retrying the original request to avoid multiple refresh attempts.
 */

import { API_BASE_URL } from "@/shared/config";

let refreshPromise: Promise<Response> | null = null;

export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {},
): Promise<Response> => {
  const res = await fetch(url, { ...options, credentials: "include" });
  if (res.status !== 401) return res;

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .catch(() => {
        return new Response(null, { status: 503 });
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  const refreshRes = await refreshPromise;

  if (!refreshRes.ok) {
    window.location.href = "/login";
    return res;
  }

  return fetch(url, { ...options, credentials: "include" });
};
