import type { GroupDetail } from "@domx/shared";

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
  loading: boolean;
  loadGroups: () => Promise<void>;
};

export type GroupCardProps = {
  group: GroupDetail;
  onClick: (groupId: string) => void;
};

// -------- GROUP HOOK TYPES
export type CreateGroupState = HookState & {
  handleCreate: (name: string) => Promise<void>;
};
