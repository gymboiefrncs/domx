import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { globalErrorHandler } from "./middlewares/globalErrorHandler.js";
import { routes } from "./routes/index.js";
import cookieParser from "cookie-parser";
import { NotFoundError } from "./utils/error.js";
import cors from "cors";
export const app: Express = express();

app.use(
  cors({
    origin: "http://localhost:5173",
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
