import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { globalErrorHandler } from "./shared/middlewares/errorHandler.js";
import { routes } from "./routes/index.js";
import cookieParser from "cookie-parser";
import { NotFoundError } from "./shared/error.js";
import cors from "cors";

export const app: Express = express();

const corsOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use(routes);

app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new NotFoundError("The requested resource was not found"));
});
app.use(globalErrorHandler);
