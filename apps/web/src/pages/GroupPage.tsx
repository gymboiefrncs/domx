import { useMe } from "@/features/profile";

export const GroupPage = () => {
  const { data: user } = useMe();
  console.log("GroupPage rendered");
  console.log("User data in GroupPage:", user);
  return <div>Group Page</div>;
};
