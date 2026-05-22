import { Route } from "@/routes/_authenticated/groups";

export const GroupSettingsPage = () => {
  const { auth: user } = Route.useRouteContext();
  console.log("GroupSettingsPage rendered");
  console.log("GroupSettingsPage user data:", user);
  return (
    <div>
      <h1>Group Settings</h1>
      {/* TODO: add design */}
    </div>
  );
};
