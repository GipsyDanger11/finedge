import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Ensure Express trusts Vercel's proxy
app.set("trust proxy", 1);

registerOAuthRoutes(app);

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Fallback error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Vercel Express Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

export default app;
