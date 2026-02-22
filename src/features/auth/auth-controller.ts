import type { NextFunction, Request, Response } from "express";
import {
  registerUser,
  loginUser,
  rotateTokens,
  logoutUser,
} from "./auth-service.js";
import { setPassword } from "./set-password.js";
import { setCookies } from "./auth-helpers/setCookies.js";

export const signupHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await registerUser(req.body);
    res.status(201).json({
      success: result.ok,
      message: result.message,
    });
    return;
  } catch (error) {
    next(error);
  }
};

export const loginHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { refreshToken, accessToken } = await loginUser(req.body);
    setCookies(refreshToken, accessToken, res);

    res.status(200).json({ success: true, message: "Login successful" });
  } catch (error) {
    next(error);
  }
};

export const rotateTokensHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const oldRefreshToken = req.cookies.refreshToken;
    const { accessToken, refreshToken } = await rotateTokens(oldRefreshToken);
    setCookies(refreshToken, accessToken, res);

    res.status(200).json({ success: true, message: "Token refreshed" });
  } catch (error) {
    next(error);
  }
};

export const logoutHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;
    const result = await logoutUser(refreshToken);
    res.clearCookie("refreshToken");
    res.clearCookie("accessToken");
    res.status(200).json({
      success: result.ok,
      message: result.ok ? result.message : "Logout failed",
    });
  } catch (error) {
    next(error);
  }
};

export const setPasswordHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { password } = req.body;
    const userId = req.setPwd!.sub;
    const result = await setPassword({ userId, password });
    res.status(result.ok ? 200 : 400).json({
      success: result.ok,
      message: result.ok ? result.message : result.reason,
    });
  } catch (error) {
    next(error);
  }
};
