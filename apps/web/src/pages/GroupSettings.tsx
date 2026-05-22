import { useMe } from "@/features/profile";

export const GroupSettingsPage = () => {
  const { data: user } = useMe();
  console.log("GroupSettingsPage rendered");
  console.log("GroupSettingsPage user data:", user);
  return (
    <div>
      <h1>Group Settings</h1>
      {/* TODO: add design */}
    </div>
  );
};
