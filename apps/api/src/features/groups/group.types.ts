export type Params = { displayId: string; groupId: string };
export type GroupResponse<T> = { data: T };
export interface GroupMemberCount {
  member_count: number;
}
export interface GroupWithMemberCount {
  group_id: string;
  member_count: number;
}
