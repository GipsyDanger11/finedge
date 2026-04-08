import "dotenv/config";
import express from "express";
import { initTRPC } from "@trpc/server";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import superjson from "superjson";
import * as MOCK from "./data.js";

console.log("[Vercel] Function starting in STATIC MOCK mode...");

const t = initTRPC.create({
  transformer: superjson,
});

// Define a simplified, zero-dependency router for Vercel production
const mockRouter = t.router({
  auth: t.router({
    me: t.procedure.query(() => MOCK.MOCK_USER),
  }),
  portfolio: t.router({
    list: t.procedure.query(() => MOCK.MOCK_PORTFOLIO),
    getOverview: t.procedure.query(() => ({
      totalValue: 170000,
      monthlyChange: 5.4,
      dailyChange: 1.2,
      lastUpdated: new Date()
    })),
  }),
  market: t.router({
    list: t.procedure.query(() => MOCK.MOCK_MARKET_DATA),
  }),
  ai: t.router({
    getMarketSummary: t.procedure.query(() => MOCK.MOCK_MARKET_SUMMARY),
    getInsights: t.procedure.query(() => ["The portfolio is well-balanced.", "Consider adding more crypto exposure."]),
  }),
  notifications: t.router({
    list: t.procedure.query(() => []),
  }),
  alerts: t.router({
    list: t.procedure.query(() => []),
  }),
});

const app = express();
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mode: "static-mock", time: new Date().toISOString() });
});

// Route everything to the mock handler
const trpcMiddleware = createExpressMiddleware({
  router: mockRouter,
  createContext: () => ({}),
});

app.use("/api/trpc", trpcMiddleware);
app.use("/trpc", trpcMiddleware);

export default app;
