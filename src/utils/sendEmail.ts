import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (email: string, otp: string) => {
  await resend.emails.send({
    from: "Acme <onboarding@resend.dev>",
    to: email,
    subject: "Verify your email",
    html: `<h3>${otp}</h3> <br> here is your verification code, it will expire in 2 minutes.`,
  });
};

export const sendAlreadyRegisteredEmail = async (email: string) => {
  await resend.emails.send({
    from: "Acme <onboarding@resend.dev>",
    to: email,
    subject: "Already Registered",
    html: `
    <h3>Welcome back!</h3>
    <p>Someone (hopefully you!) tried to sign up for an account with this email.</p>
    <p>You already have an account with us, so you can just head straight to the login page:</p>
    <br><br>
    <p>If this wasn't you, you can safely ignore this email.</p>
  `,
  });
};

export const loginFailedEmail = async (email: string) => {
  await resend.emails.send({
    from: "Acme <onboarding@resend.dev>",
    to: email,
    subject: "Login Failed",
    html: `
      <h3>Login Failed</h3>
      <p>Someone tried to log in to your account with an incorrect password.</p>
      <p>If this was you, ignore this email</p>
      <p>If this wasn't you, you should change your password immediately.</p>
    `,
  });
};
