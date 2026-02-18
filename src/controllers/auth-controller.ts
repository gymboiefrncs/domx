import type { NextFunction, Request, Response } from "express";
import {
  registerUser,
  loginUser,
  rotateTokens,
  logoutUser,
} from "../services/auth-service.js";

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
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 5 * 60 * 1000,
    });

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

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 5 * 60 * 1000,
    });
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
