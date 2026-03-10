export type GroupRoles = "admin" | "member";
export type Params = { displayId: string; groupId: string };
export type Group = {
  id: string;
  name: string;
  role: GroupRoles;
};
