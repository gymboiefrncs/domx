import type { GroupDetail, NewMember, PostDetails } from "@domx/shared";

type HookState = {
  loading: boolean;
};

export type ApiResponse = {
  success: boolean;
  message: string;
  data?: unknown;
};

// -------- SIGNUP HOOK TYPES
export type SignupState = HookState & {
  handleSignup: (email: string) => Promise<void>;
};
export type VerifyOTPState = HookState & {
  handleVerifyOTP: (email: string, otp: string) => Promise<void>;
};
export type SetInfoState = HookState & {
  handleSetInfo: (username: string, password: string) => Promise<void>;
};

// -------- LOGIN HOOK STATE
export type LoginState = HookState & {
  handleLogin: (email: string, password: string) => Promise<void>;
};

// --------API RESPONSE RETURN TYPE
export type serviceResponse = { success: boolean; message: string };

// --------GROUP TYPES
export type GroupContextType = {
  groups: GroupDetail[];
  setGroupList: (data: GroupDetail[]) => void;
  renameGroupInList: (groupId: string, newName: string) => void;
  deleteGroupInList: (groupId: string) => void;
};

export type Props = {
  onClose: () => void;
};

export type AddMemberProps = {
  onClose: () => void;
  onSuccess: (newMember: NewMember) => void;
};

export type GroupCardProps = {
  group: GroupDetail;
  onClick: (groupId: string) => void;
};

// -------- GROUP HOOK TYPES
export type CreateGroupState = HookState & {
  handleCreate: (name: string) => Promise<void>;
};
export type UpdateGroupNameState = HookState & {
  handleUpdateName: (groupId: string, newName: string) => Promise<void>;
};
export type AddMemberState = HookState & {
  handleAddMember: (groupId: string, displayId: string) => Promise<void>;
};
export type DeleteGroupState = HookState & {
  handleDeleteGroup: (groupId: string) => Promise<void>;
};

// -------- POST HOOK TYPES
export type CreatePostState = {
  loadingPost: boolean;
  handleCreatePost: (
    groupId: string,
    body: string,
    title: string,
  ) => Promise<void>;
};

export type GetPostsState = HookState & {
  posts: PostDetails[];
  addPost: (post: PostDetails) => void;
};
