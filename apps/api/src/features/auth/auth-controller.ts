import type { NextFunction, Request, Response } from "express";
import {
  registerUser,
  loginUser,
  rotateTokens,
  logoutUser,
} from "./auth-service.js";
import { setInfo } from "./set-info.js";
import { setCookies } from "./auth-helpers/setCookies.js";
import { UnauthorizedError } from "../../utils/error.js";
import { INCOMPLETE_SIGNUP_TOKEN_MAX_AGE } from "../../common/constants.js";
export const signupHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await registerUser(req.body);
    if (result.reason === "INCOMPLETE_SIGNUP") {
      res.cookie("setInfoToken", result.data.setInfoToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: INCOMPLETE_SIGNUP_TOKEN_MAX_AGE,
      });
      res.status(200).json({
        success: true,
        message: result.reason,
      });
    }

    res.status(201).json({
      success: result.ok,
      message: result.message,
    });
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
    if (!oldRefreshToken) throw new UnauthorizedError("Invalid refresh token");
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

export const setInfoHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { password, username } = req.body;
    const userId = req.setInfo?.sub;
    if (!userId) throw new UnauthorizedError("Invalid token payload");

    const result = await setInfo({ userId, password, username });
    res.clearCookie("setInfoToken");

    res.status(result.ok ? 200 : 400).json({
      success: result.ok,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};
