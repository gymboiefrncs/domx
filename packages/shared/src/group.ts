export type GroupRole = "admin" | "member";

export type Group = {
  group_id: string;
  name: string;
  role: GroupRole;
};

export type CreateGroup = {
  group_id: string;
};

export type GroupDetail = Group & {
  last_seen_at: Date | null;
  unread_count: number;
  member_count: number;
};

export type NewMember = {
  role: GroupRole;
  display_id: string;
  username: string;
};
