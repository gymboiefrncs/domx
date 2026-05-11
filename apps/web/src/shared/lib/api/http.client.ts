import { API_BASE_URL } from "@/shared/config";
import { getApiErrorMessage } from "@/shared/lib/errors";

// A promise representing the ongoing refresh request, if any.
let pendingRefresh: Promise<Response> | null = null;

/**
 * Handles token refresh when a 401 Unauthorized response is received. It ensures
 * that only one refresh request is made at a time, and subsequent requests wait
 * for the refresh to complete before retrying the original request to avoid multiple refresh attempts.
 */
async function refreshAndRetry(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const response = await fetch(url, { credentials: "include", ...options });

  const isAuthRoute =
    url.includes("/auth/") ||
    url.includes("/verify-email") ||
    url.includes("/resend-otp");

  if (response.status !== 401 || isAuthRoute) return response;

  if (!pendingRefresh) {
    pendingRefresh = fetch(`${API_BASE_URL}/auth/refresh`, {
      credentials: "include",
      method: "POST",
    })
      .catch(() => new Response(null, { status: 503 }))
      .finally(() => {
        pendingRefresh = null;
      });
  }

  /**
   * Wait for the first refresh request to complete before retrying the original request.
   * This prevents multiple simultaneous refresh attempts and
   * ensures that all requests wait for the token to be refreshed before retrying.
   */
  const refreshResponse = await pendingRefresh;

  if (!refreshResponse.ok) {
    window.location.href = "/login";
    return response;
  }

  return fetch(url, { credentials: "include", ...options });
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T | null> {
  const response = await refreshAndRetry(`${API_BASE_URL}${path}`, options);

  if (response.status === 204) return null;

  const body = await response.json();

  if (!response.ok) {
    throw new Error(getApiErrorMessage(body));
  }

  return body as T;
}

export const httpClient = {
  get: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, body?: object, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: JSON.stringify(body),
    }),

  put: <T>(path: string, body?: object, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: JSON.stringify(body),
    }),

  patch: <T>(path: string, body?: object, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: JSON.stringify(body),
    }),

  delete: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
