type HookState = {
  loading: boolean;
};

export type SignupState = HookState & {
  handleSignup: (email: string) => Promise<void>;
};

export type VerifyOTPState = HookState & {
  handleVerifyOTP: (email: string, otp: string) => Promise<void>;
};

export type SetInfoState = HookState & {
  handleSetInfo: (username: string, password: string) => Promise<void>;
};

export type ResendOTPState = HookState & {
  handleResendOTP: (email: string) => Promise<void>;
};

export type LoginState = HookState & {
  handleLogin: (email: string, password: string) => Promise<void>;
};
