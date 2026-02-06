import type { Express } from "express";
import express from "express";
import { globalErrorHandler } from "./middlewares/globalErrorHandler.js";
import { routes } from "./routes/index.js";

export const app: Express = express();

app.use(express.json());

app.use(routes);
app.use(globalErrorHandler);
