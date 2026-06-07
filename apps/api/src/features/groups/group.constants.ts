export const GROUP_SUCCESS = {
  LEFT_GROUP: "You have left the group.",
} as const;

export const GROUP_ERROR = {
  NOT_FOUND: "Group does not exist.",
  NOT_A_MEMBER: "You must be a member of this group to perform this action.",
} as const;

export const SELECT_GROUP_DETAILS_FIELDS = `
            SELECT 
            g.group_id, 
            g.name, 
            gm.role,
            gm.last_seen_at,
            (
              SELECT COUNT(*)::int 
              FROM threads t 
              WHERE t.group_id = g.group_id 
                AND t.user_id != $1 
                AND t.created_at > COALESCE(gm.last_seen_at, gm.joined_at)
            ) AS unread_count,
            (
              SELECT COUNT(*)::int 
              FROM group_members 
              WHERE group_id = g.group_id
            ) AS member_count
`;
