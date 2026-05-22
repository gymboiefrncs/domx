import { Route } from "@/routes/_authenticated";

export const ProfilePage = () => {
  const { auth: user } = Route.useRouteContext();

  return (
    <div>
      <h1>Profile</h1>
      <div>
        <p>Name: {user.username}</p>
        <p>Display ID: {user.display_id}</p>
        <p>Email: {user.email}</p>
      </div>
      {/* TODO: add design */}
    </div>
  );
};
