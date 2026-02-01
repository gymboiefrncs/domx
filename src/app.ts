import type { Express } from "express";
import express from "express";
import dotenv from "dotenv";
dotenv.config();

export const app: Express = express();
