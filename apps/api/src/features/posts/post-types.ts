export type PostParams = { groupId: string; postId: string };
export type Post = {
  username: string;
  display_Id: string;
  id: string;
  user_id: string;
  group_id: string;
  body: string;
  created_at: Date;
  updated_at: Date;
};
