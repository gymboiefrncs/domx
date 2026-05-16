type HookState = {
  loading: boolean;
};

export type SignupState = HookState & {
  handleSignup: (email: string) => void;
};

export type VerifyOTPState = HookState & {
  handleVerifyOTP: ({ email, otp }: { email: string; otp: string }) => void;
};

export type SetInfoState = HookState & {
  handleSetInfo: ({
    username,
    password,
  }: {
    username: string;
    password: string;
  }) => void;
};

export type ResendOTPState = HookState & {
  handleResendOTP: (email: string) => void;
};

export type LoginState = HookState & {
  handleLogin: ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => void;
};
