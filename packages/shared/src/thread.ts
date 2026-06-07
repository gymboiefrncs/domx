export type Thread = {
  id: string;
  user_id: string;
  group_id: string;
  title: string;
  content: string;
  created_at: Date;
  updated_at: Date;
};

export type ThreadDetails = Thread & {
  username: string;
  display_id: string;
};
