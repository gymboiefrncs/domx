import { useEffect, useState } from "react";
import type { Group } from "../components/GroupCard";

export const useMyGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchGroup() {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:8080/api/v1/groups", {
          credentials: "include",
        });
        const json = await res.json();
        setGroups(json.data ?? []);
      } catch (err) {
        // use any for now since we don't have a defined error type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setError(err as any);
        console.log("Failed to fetch groups", err);
      } finally {
        setLoading(false);
      }
    }
    fetchGroup();
  }, []);

  return { groups, loading, error };
};
