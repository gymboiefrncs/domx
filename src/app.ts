import type { Express } from "express";
import express from "express";
import { globalErrorHandler } from "./middlewares/globalErrorHandler.js";
import { routes } from "./routes/index.js";
import cookieParser from "cookie-parser";

export const app: Express = express();

app.use(express.json());
app.use(cookieParser());

app.use(routes);
app.use(globalErrorHandler);
