import { generateDisplayId } from "./auth-helpers/generateDisplayId.js";
import { setUserInfoOnce } from "./auth.repositories.js";
import bcrypt from "bcrypt";
import type { UserInfo } from "./auth.types.js";
import { config } from "@api/shared/config.js";
import { BadRequestError } from "@api/shared/error.js";

const INFO_SET_FAILED_MESSAGE = "Failed to set information";
const DISPLAY_ID_RETRY_LIMIT = 3;

type PgLikeError = Error & { code?: string; constraint?: string };

const isDisplayIdConflict = (error: unknown): boolean => {
  return (
    error instanceof Error &&
    (error as PgLikeError).code === "23505" &&
    (error as PgLikeError).constraint === "users_display_id_key"
  );
};

export const setInfo = async ({
  userId,
  username,
  password,
}: UserInfo): Promise<void> => {
  const hashedPassword = await bcrypt.hash(
    password,
    config.server.nodeEnv === "production" ? 12 : 10,
  );

  /**
   * We need to retry if the generated display_id conflicts with an existing one.
   * We set a retry limit to avoid potential infinite loops in case of unforeseen issues.
   */
  for (let attempt = 0; attempt < DISPLAY_ID_RETRY_LIMIT; attempt++) {
    const displayId = generateDisplayId();

    try {
      const updated = await setUserInfoOnce(
        userId,
        username,
        hashedPassword,
        displayId,
      );

      // Fail fast when the user is not eligible or already set info (e.g., already has a username and password).
      if (!updated) {
        throw new BadRequestError(INFO_SET_FAILED_MESSAGE);
      }
      return;
    } catch (error) {
      // Retry only if the generated display_id collided with an existing one.
      if (isDisplayIdConflict(error) && attempt < DISPLAY_ID_RETRY_LIMIT - 1) {
        continue;
      }

      throw error;
    }
  }
};
