import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchProfile } from "../api/profile.api";

export const meQueryOptions = queryOptions({
  queryKey: ["profile", "me"],
  queryFn: fetchProfile,
  staleTime: Infinity,
});

export const useMe = () => {
  return useQuery(meQueryOptions);
};
