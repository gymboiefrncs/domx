export type GroupRole = "admin" | "member";

export interface Group {
  group_id: string;
  name: string;
  role: GroupRole;
  last_seen_at: Date | null;
  unread_count: number;
  member_count: number;
}

export interface CreateGroup {
  group_id: string;
}

export interface Member {
  role: GroupRole;
  display_id: string;
  username: string;
  group_id: string;
}
