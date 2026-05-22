import { Route } from "@/routes/_authenticated/groups";

export const GroupPage = () => {
  const { auth: user } = Route.useRouteContext();
  console.log("GroupPage rendered");
  console.log("User data in GroupPage:", user);
  return (
    <div>
      <h1>Group Page</h1>
      {/* TODO: add design */}
      {/* TODO: add group list */}
    </div>
  );
};
