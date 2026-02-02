import type { Express } from "express";
import { router } from "./routes/auth-routes.js";
import express from "express";

export const app: Express = express();

app.use(express.json());

app.use("/", router);
