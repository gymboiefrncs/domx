import type { Profile } from "../common/types.js";
import { pool } from "../config/db.js";

export const profileModel = async (
  userid: string,
): Promise<Profile | undefined> => {
  const query = `
    SELECT 
      u.username, 
      json_agg(p.*) AS posts
    FROM users u 
    LEFT JOIN posts p ON u.id = p.author_id 
    WHERE u.id = $1
    GROUP BY u.id, u.username;
  `;

  const result = await pool.query<Profile>(query, [userid]);
  return result.rows[0];
};
