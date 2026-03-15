export const OTP_COOLDOWN_MS =
  process.env.NODE_ENV === "development" ? 5000 : 2 * 60 * 1000; // 2 minutes
export const INCOMPLETE_SIGNUP_TOKEN_MAX_AGE = 10 * 60 * 1000;

// user facing messages.
export const EMAIL_MESSAGE =
  "Verification email sent. Please check your inbox.";
export const COOLDOWN_MESSAGE = "Please wait before requesting another code.";
export const ALREADY_REGISTERED_MESSAGE =
  "If this email is registered, you'll hear from us shortly.";
export const OTP_MESSAGE_FAIL = "OTP is invalid or expired";
export const OTP_MESSAGE_SUCCESS = "Email verified successfully";
export const RESEND_OTP_MESSAGE =
  "If an account exists, a new code has been sent.";
export const LOGOUT_MESSAGE = "You have been logged out successfully.";
export const INFO_SET_SUCCESS_MESSAGE = "Information set successfully";
export const INFO_SET_FAILED_MESSAGE = "Failed to set information";
export const SUCCESSFULLY_CREATED_GROUP_MESSAGE = "Group created successfully.";
export const MEMBER_ADDED = "Member added to the group.";
export const MEMBER_KICKED = "Member has been removed from the group.";
export const MEMBER_PROMOTED = "Member has been promoted to admin.";
export const MEMBER_DEMOTED = "Member has been demoted to regular member.";
export const LEFT_GROUP = "You have left the group.";
export const GROUP_NOT_FOUND = "Group does not exist.";
export const ALREADY_A_MEMBER = "User is already a member of this group.";
export const ALREADY_AN_ADMIN = "User is already an admin.";
export const ALREADY_A_REGULAR_MEMBER = "User is already a regular member.";
export const NOT_A_GROUP_MEMBER =
  "You must be a member of this group to perform this action.";
export const USER_NOT_FOUND =
  "User with the provided display ID does not exist.";
export const CANNOT_KICK_SELF =
  "You cannot remove yourself. Use the leave option instead.";
export const SOLE_ADMIN_CANNOT_LEAVE =
  "Promote a member to admin before leaving this group.";
export const SOLE_ADMIN_CANNOT_DEMOTE =
  "Cannot demote. This would leave the group with no admins.";

export const POST_EDITED = "Post edited successfully.";
export const POST_CREATED = "Post created successfully.";
export const POST_DELETED = "Post deleted successfully.";
export const POST_NOT_FOUND = "Post does not exist.";
export const CANNOT_EDIT_POST = "You are not allowed to edit this post.";
export const CANNOT_DELETE_POST = "You are not allowed to delete this post.";
