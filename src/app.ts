import type { Express } from "express";
import { authRouter } from "./routes/auth-routes.js";
import express from "express";
import { globalErrorHandler } from "./middlewares/globalErrorHandler.js";
import { verificationRouter } from "./routes/verification-route.js";

export const app: Express = express();

app.use(express.json());

app.use("/", authRouter);
app.use("/", verificationRouter);
app.use(globalErrorHandler);
