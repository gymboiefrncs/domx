export type Post = {
  id: string;
  user_id: string;
  group_id: string;
  title: string;
  body: string;
  created_at: Date;
  updated_at: Date;
};

export type PostDetails = Post & {
  username: string;
  display_id: string;
};
