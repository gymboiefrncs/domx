import { queryOptions } from "@tanstack/react-query";
import { fetchProfile } from "./api/profile.api";

export const meQueryOptions = queryOptions({
  queryKey: ["profile", "me"] as const,
  queryFn: fetchProfile,
  staleTime: Infinity,
});
