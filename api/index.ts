import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { appRouter } from "../server/routers/index"; // Explicit path
import { createContext } from "../server/_core/context";

console.log("[Vercel] Function starting...");

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Ensure Express trusts Vercel's proxy
app.set("trust proxy", 1);

// Debug logging for Vercel environment
app.use((req, res, next) => {
  console.log(`[Vercel Request] ${req.method} ${req.url}`);
  next();
});

// Health check and diagnostics endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    env: {
      hasDb: !!(process.env.MONGODB_URI || process.env.DATABASE_URL),
      hasMistral: !!process.env.MISTRAL_API_KEY,
      nodeEnv: process.env.NODE_ENV
    },
    url: req.url,
    time: new Date().toISOString()
  });
});

registerOAuthRoutes(app);

// Mount TRPC with flexible path matching
const trpcMiddleware = createExpressMiddleware({
  router: appRouter,
  createContext,
});

app.use("/api/trpc", trpcMiddleware);
app.use("/trpc", trpcMiddleware);

// Fallback error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Vercel Express Error:", err);
  res.status(500).json({ 
    error: "Internal Server Error",
    message: err.message,
    path: req.url
  });
});

export default app;
