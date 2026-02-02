import type { Express } from "express";
import { router } from "./routes/auth-routes.js";
import express from "express";
import { globalErrorHandler } from "./middlewares/globalErrorHandler.js";

export const app: Express = express();

app.use(express.json());

app.use("/", router);
app.use(globalErrorHandler);
