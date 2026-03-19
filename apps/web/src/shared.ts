type HookState = {
  loading: boolean;
};

// -------- SIGNUP HOOK STATE
export type SignupState = HookState & {
  handleSignup: (email: string) => Promise<void>;
};
export type VerifyOTPState = HookState & {
  handleVerifyOTP: (email: string, otp: string) => Promise<void>;
};
export type SetInfoState = HookState & {
  handleSetInfo: (username: string, password: string) => Promise<void>;
};

// --------API RESPONSE RETURN TYPE
export type serviceResponse = { success: boolean; message: string };
